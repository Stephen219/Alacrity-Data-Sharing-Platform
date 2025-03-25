# datasets/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Chat, Message, Dataset
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    allowed_roles = ['organization_admin', 'contributor', 'researcher']

    async def connect(self):
        self.dataset_id = self.scope['url_route']['kwargs']['dataset_id']
        self.room_group_name = f'chat_{self.dataset_id}'
        query_string = self.scope['query_string'].decode()
        token = dict(q.split('=') for q in query_string.split('&') if '=' in q).get('token')

        user = await self.authenticate_user(token)
        if not user or not await self.has_required_role(user):
            await self.close(code=4001, reason="Unauthorized")
            return

        self.user = user
        print(f"User {self.user.email} authenticated with role {self.user.role}")

        # Add user and contributor to chat participants on connect
        await self.add_user_and_contributor_to_chat()

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        contributor = await self.get_dataset_contributor()
        if contributor and contributor != self.user:
            contributor_channel = f"user_{contributor.id}"
            await self.channel_layer.group_add(self.room_group_name, contributor_channel)
            print(f"Added contributor {contributor.email} to group {self.room_group_name}")

        await self.accept()
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': f'Connected to chat for dataset {self.dataset_id}'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            content = data.get('content')
            if not content:
                return

            saved_message = await self.save_message(content)
            if saved_message:
                contributor = await self.get_dataset_contributor()
                sender_role = 'admin' if self.user == contributor else 'user'
                print(f"Message from {self.user.email} as {sender_role} for dataset {self.dataset_id}")
                # Broadcast to chat group (for ChatPage)
                await self.channel_layer.group_send(self.room_group_name, {
                    'type': 'chat_message',
                    'message': {
                        'id': saved_message['id'],
                        'sender': sender_role,
                        'content': saved_message['content'],
                        'timestamp': saved_message['timestamp']
                    }
                })
                # Notify contributor via user channel (for ChatListPage)
                if contributor and contributor != self.user:
                    dataset = await self.get_dataset()
                    await self.channel_layer.group_send(
                        f"user_{contributor.id}",
                        {
                            'type': 'user_message',
                            'message': {
                                'dataset_id': self.dataset_id,
                                'title': dataset.title,
                                'organization': dataset.organization_name,
                                'last_message': saved_message['content'],
                                'last_timestamp': saved_message['timestamp']
                            }
                        }
                    )
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({'error': 'Invalid JSON'}))
        except Exception as e:
            await self.send(text_data=json.dumps({'error': str(e)}))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({'message': event['message']}))

    @database_sync_to_async
    def authenticate_user(self, token):
        try:
            if not token:
                return None
            validated_token = AccessToken(token)
            user_id = validated_token['user_id']
            return User.objects.get(id=user_id)
        except Exception as e:
            print(f"Token validation failed: {e}")
            return None

    @database_sync_to_async
    def has_required_role(self, user):
        if not user.is_authenticated:
            return False
        user_role = getattr(user, 'role', None)
        return user_role in self.allowed_roles

    @database_sync_to_async
    def get_dataset_contributor(self):
        try:
            dataset = Dataset.objects.get(dataset_id=self.dataset_id)
            return dataset.contributor_id
        except Dataset.DoesNotExist:
            print(f"Dataset not found: {self.dataset_id}")
            return None

    @database_sync_to_async
    def get_dataset(self):
        return Dataset.objects.get(dataset_id=self.dataset_id)

    @database_sync_to_async
    def save_message(self, content):
        try:
            dataset = Dataset.objects.get(dataset_id=self.dataset_id)
            chat, created = Chat.objects.get_or_create(dataset=dataset)
            if created or self.user not in chat.participants.all():
                chat.participants.add(self.user)
            contributor = dataset.contributor_id
            if contributor and contributor not in chat.participants.all():
                chat.participants.add(contributor)
                print(f"Added contributor {contributor.email} as participant in save_message")
            message = Message.objects.create(chat=chat, content=content, sender=self.user)
            return {
                'id': message.message_id,
                'sender': self.user.email,
                'content': message.content,
                'timestamp': message.created_at.isoformat()
            }
        except Dataset.DoesNotExist:
            print(f"Dataset not found: {self.dataset_id}")
            return None
        except Exception as e:
            print(f"Error saving message: {str(e)}")
            return None

    @database_sync_to_async
    def add_user_and_contributor_to_chat(self):
        try:
            dataset = Dataset.objects.get(dataset_id=self.dataset_id)
            chat, created = Chat.objects.get_or_create(dataset=dataset)
            if self.user not in chat.participants.all():
                chat.participants.add(self.user)
                print(f"Added user {self.user.email} as participant to chat {chat.chat_id}")
            contributor = dataset.contributor_id
            if contributor and contributor != self.user and contributor not in chat.participants.all():
                chat.participants.add(contributor)
                print(f"Added contributor {contributor.email} as participant to chat {chat.chat_id}")
        except Dataset.DoesNotExist:
            print(f"Dataset not found: {self.dataset_id}")
        except Exception as e:
            print(f"Error adding participants: {str(e)}")