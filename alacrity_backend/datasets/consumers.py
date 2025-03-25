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
            print(f"Connection rejected for dataset {self.dataset_id}: Unauthorized")
            await self.close(code=4001, reason="Unauthorized")
            return

        self.user = user
        print(f"User {self.user.email} authenticated with role {self.user.role} for dataset {self.dataset_id}")

        await self.add_user_and_contributor_to_chat()
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        contributor = await self.get_dataset_contributor()
        if contributor and contributor != self.user:
            contributor_channel = f"user_{contributor.id}"
            await self.channel_layer.group_add(contributor_channel, self.channel_name)
            print(f"Added {self.user.email} to contributor channel {contributor_channel} for group {self.room_group_name}")

        await self.accept()
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': f'Connected to chat for dataset {self.dataset_id}'
        }))
        print(f"WebSocket connection established for {self.user.email} on {self.room_group_name}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        contributor = await self.get_dataset_contributor()
        if contributor and contributor != self.user:
            contributor_channel = f"user_{contributor.id}"
            await self.channel_layer.group_discard(contributor_channel, self.channel_name)
        print(f"WebSocket disconnected for {self.user.email} from {self.room_group_name}, code: {close_code}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            content = data.get('content')
            typing = data.get('typing')

            if content:
                saved_message = await self.save_message(content)
                if saved_message:
                    contributor = await self.get_dataset_contributor()
                    sender_role = 'admin' if self.user == contributor else 'user'
                    dataset = await self.get_dataset()
                    chat = await self.get_chat()
                    unread_count = await self.get_unread_count(chat)
                    message_data = {
                        'message_id': saved_message['id'],
                        'sender': sender_role,
                        'content': saved_message['content'],
                        'timestamp': saved_message['timestamp'],
                        'sender_first_name': self.user.first_name,
                        'sender_sur_name': self.user.sur_name,
                        'sender_profile_picture': self.user.profile_picture or None,
                    }
                    print(f"Broadcasting message to {self.room_group_name}: {message_data}")
                    # Broadcast to all chat participants (ChatPage)
                    await self.channel_layer.group_send(self.room_group_name, {
                        'type': 'chat_message',
                        'message': message_data
                    })
                    # Notify contributor specifically (ChatListPage and ChatPage)
                    if contributor and contributor != self.user:
                        contributor_channel = f"user_{contributor.id}"
                        user_message_data = {
                            'dataset_id': self.dataset_id,
                            'title': dataset.title,
                            'organization': dataset.organization_name,
                            'last_message': saved_message['content'],
                            'last_timestamp': saved_message['timestamp'],
                            'participant_first_name': self.user.first_name,
                            'participant_sur_name': self.user.sur_name,
                            'participant_profile_picture': self.user.profile_picture or None,
                            'unread_count': unread_count if self.user != contributor else 0,
                        }
                        print(f"Notifying contributor {contributor.email} via {contributor_channel}: {user_message_data}")
                        await self.channel_layer.group_send(
                            contributor_channel,
                            {
                                'type': 'user_message',
                                'message': user_message_data
                            }
                        )
            elif typing is not None:
                contributor = await self.get_dataset_contributor()
                if contributor and contributor != self.user:
                    contributor_channel = f"user_{contributor.id}"
                    typing_data = {
                        'dataset_id': self.dataset_id,
                        'is_typing': typing,
                    }
                    await self.channel_layer.group_send(
                        contributor_channel,
                        {
                            'type': 'typing_event',
                            'dataset_id': self.dataset_id,
                            'is_typing': typing,
                        }
                    )
        except json.JSONDecodeError as e:
            await self.send(text_data=json.dumps({'error': 'Invalid JSON'}))
        except Exception as e:
            await self.send(text_data=json.dumps({'error': str(e)}))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({'message': event['message']}))

    async def typing_event(self, event):
        await self.send(text_data=json.dumps({
            'typing': event['is_typing'],
            'dataset_id': event['dataset_id']
        }))

    async def user_message(self, event):
        await self.send(text_data=json.dumps({'message': event['message']}))

    @database_sync_to_async
    def authenticate_user(self, token):
        try:
            if not token:
                return None
            validated_token = AccessToken(token)
            user_id = validated_token['user_id']
            user = User.objects.get(id=user_id)
            return user
        except Exception as e:
            return None

    @database_sync_to_async
    def has_required_role(self, user):
        if not user.is_authenticated:
            print(f"User {user.email} not authenticated")
            return False
        user_role = getattr(user, 'role', None)
        print(f"Checking role for {user.email}: {user_role}")
        return user_role in self.allowed_roles

    @database_sync_to_async
    def get_dataset_contributor(self):
        try:
            dataset = Dataset.objects.get(dataset_id=self.dataset_id)
            contributor = dataset.contributor_id
            print(f"Dataset {self.dataset_id} contributor: {contributor.email if contributor else 'None'}")
            return contributor
        except Dataset.DoesNotExist:
            print(f"Dataset not found: {self.dataset_id}")
            return None

    @database_sync_to_async
    def get_dataset(self):
        try:
            dataset = Dataset.objects.get(dataset_id=self.dataset_id)
            print(f"Retrieved dataset: {dataset.title}")
            return dataset
        except Dataset.DoesNotExist:
            print(f"Dataset not found: {self.dataset_id}")
            return None

    @database_sync_to_async
    def get_chat(self):
        try:
            chat = Chat.objects.get(dataset__dataset_id=self.dataset_id)
            print(f"Retrieved chat: {chat.chat_id}")
            return chat
        except Chat.DoesNotExist:
            print(f"Chat not found for dataset: {self.dataset_id}")
            return None

    @database_sync_to_async
    def get_unread_count(self, chat):
        try:
            unread_count = chat.messages.filter(read=False).exclude(sender=self.user).count()
            print(f"Unread count for chat {chat.chat_id}: {unread_count}")
            return unread_count
        except Exception as e:
            print(f"Error calculating unread count: {str(e)}")
            return 0

    @database_sync_to_async
    def save_message(self, content):
        try:
            dataset = Dataset.objects.get(dataset_id=self.dataset_id)
            chat, created = Chat.objects.get_or_create(dataset=dataset)
            if created:
                print(f"Created new chat for dataset {self.dataset_id}")
            if self.user not in chat.participants.all():
                chat.participants.add(self.user)
                print(f"Added {self.user.email} to chat participants")
            contributor = dataset.contributor_id
            if contributor and contributor not in chat.participants.all():
                chat.participants.add(contributor)
                print(f"Added contributor {contributor.email} to chat participants")
            message = Message.objects.create(chat=chat, content=content, sender=self.user)
            print(f"Saved message {message.message_id} from {self.user.email}: {content}")
            return {
                'id': str(message.message_id),
                'content': message.content,
                'timestamp': message.created_at.isoformat()
            }
        except Exception as e:
            print(f"Error saving message for {self.user.email}: {str(e)}")
            return None

    @database_sync_to_async
    def add_user_and_contributor_to_chat(self):
        try:
            dataset = Dataset.objects.get(dataset_id=self.dataset_id)
            chat, created = Chat.objects.get_or_create(dataset=dataset)
            if created:
                print(f"Created new chat for dataset {self.dataset_id} in add_user_and_contributor")
            if self.user not in chat.participants.all():
                chat.participants.add(self.user)
                print(f"Added {self.user.email} as participant to chat {chat.chat_id}")
            contributor = dataset.contributor_id
            if contributor and contributor != self.user and contributor not in chat.participants.all():
                chat.participants.add(contributor)
                print(f"Added contributor {contributor.email} as participant to chat {chat.chat_id}")
        except Dataset.DoesNotExist:
            print(f"Dataset not found: {self.dataset_id}")
        except Exception as e:
            print(f"Error adding participants: {str(e)}")