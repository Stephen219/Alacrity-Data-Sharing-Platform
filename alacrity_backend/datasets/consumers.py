# datasets/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from .models import Chat, Message, Dataset
from users.decorators import role_required  # For reference, we’ll adapt it

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    allowed_roles = ['organization_admin', 'contributor', 'researcher']

    async def connect(self):
        self.dataset_id = self.scope['url_route']['kwargs']['dataset_id']
        self.room_group_name = f'chat_{self.dataset_id}'

        # Extract token from query string
        query_string = self.scope['query_string'].decode()
        token = dict(q.split('=') for q in query_string.split('&') if '=' in q).get('token')

        # Authenticate and validate role
        user = await self.authenticate_user(token)
        if not user or not await self.has_required_role(user):
            print(f"Unauthorized connection attempt: Token={token}")
            await self.close(code=4001, reason="Unauthorized")
            return

        self.user = user
        print(f"User {self.user.email} authenticated with role {self.user.role}")

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        
        # Accept the connection
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': f'Connected to chat for dataset {self.dataset_id}'
        }))

    async def disconnect(self, close_code):
        print(f"Disconnected from {self.room_group_name} with code {close_code}")
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            content = data.get('content')
            if not content:
                return

            # Re-validate role before processing (optional, for extra security)
            if not await self.has_required_role(self.user):
                await self.send(text_data=json.dumps({'error': 'Unauthorized action'}))
                await self.close(code=4001)
                return

            saved_message = await self.save_message(content)
            if saved_message:
                await self.channel_layer.group_send(self.room_group_name, {
                    'type': 'chat_message',
                    'message': {
                        'id': saved_message['id'],
                        'sender': saved_message['sender'],
                        'content': saved_message['content'],
                        'timestamp': saved_message['timestamp']
                    }
                })
            else:
                await self.send(text_data=json.dumps({'error': 'Failed to save message'}))
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({'error': 'Invalid JSON'}))
        except Exception as e:
            await self.send(text_data=json.dumps({'error': str(e)}))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({'message': event['message']}))

    @database_sync_to_async
    def authenticate_user(self, token):
        """Validate JWT token and return the user."""
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
        """Check if the user has one of the allowed roles."""
        if not user.is_authenticated:
            return False
        # Assuming your User model has a 'role' field or similar
        user_role = getattr(user, 'role', None)  # Adjust based on your User model
        return user_role in self.allowed_roles

    @database_sync_to_async
    def save_message(self, content):
        try:
            dataset = Dataset.objects.get(dataset_id=self.dataset_id)
            chat, created = Chat.objects.get_or_create(dataset=dataset)
            if created or self.user not in chat.participants.all():
                chat.participants.add(self.user)
            message = Message.objects.create(chat=chat, content=content, sender=self.user)
            return {
                'id': message.message_id,
                'sender': self.user.email,
                'content': message.content,
                'timestamp': message.created_at.isoformat()
            }
        except Dataset.DoesNotExist:
            print(f"Dataset {self.dataset_id} not found")
            return None
        except Exception as e:
            print(f"Error saving message: {str(e)}")
            return None