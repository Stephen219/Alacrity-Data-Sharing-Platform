# datasets/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Chat, Message
from datetime import datetime

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.dataset_id = self.scope['url_route']['kwargs']['dataset_id']
        self.room_group_name = f'chat_{self.dataset_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        # Accept the connection
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': f'Connected to chat for dataset {self.dataset_id}'
        }))

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            content = data.get('content')
            sender = data.get('sender')
            timestamp = data.get('timestamp')
            
            if not content:
                return
            
            # Generate a message ID
            message_id = f"{datetime.now().timestamp()}"
            
            # Don't try to save to database yet (for testing first)
            # await self.save_message(content, sender)
            
            # Broadcast message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': {
                        'id': message_id,
                        'sender': sender,
                        'content': content,
                        'timestamp': timestamp
                    }
                }
            )
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'error': 'Invalid JSON'
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'error': str(e)
            }))

    async def chat_message(self, event):
        message = event['message']
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message
        }))
    
    @database_sync_to_async
    def save_message(self, content, sender_type):
        """
        Save message to database - commented out for initial testing
        """
        pass
        # Try to get or create chat for this dataset
        # chat, created = Chat.objects.get_or_create(dataset_id=self.dataset_id)
        
        # Get the sender (this will depend on your authentication setup)
        # user = self.scope.get('user', None)
        # if not user or user.is_anonymous:
        #     # Get a default user or handle anonymous case
        #     user = User.objects.get(username='default_user')
        
        # Create the message
        # message = Message.objects.create(
        #     chat=chat,
        #     content=content,
        #     sender=user
        # )
        
        # return message