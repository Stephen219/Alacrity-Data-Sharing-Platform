
import json
import re
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework_simplejwt.tokens import AccessToken
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Conversation, Message
from django.core.cache import cache  # For rate limiting
from asgiref.sync import sync_to_async

User = get_user_model()

class UserConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_string = self.scope['query_string'].decode()
        token = dict(q.split('=') for q in query_string.split('&') if '=' in q).get('token')
        user = await self.authenticate_user(token)
        if not user:
            await self.close(code=4001, reason="Unauthorized")
            return

        self.user = user
        self.user_channel_name = f"user_{user.id}"
        await self.channel_layer.group_add(self.user_channel_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.user_channel_name, self.channel_name)

    async def user_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

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
        
class ChatConsumer(AsyncWebsocketConsumer):
    """Handles user-to-user chat for a specific conversation."""
    async def connect(self):
        query_string = self.scope['query_string'].decode()
        token = dict(q.split('=') for q in query_string.split('&') if '=' in q).get('token')
        user = await self.authenticate_user(token)
        if not user:
            await self.close(code=4001, reason="Unauthorized")
            return

        self.user = user
        self.conversation_id = self.scope['url_route']['kwargs'].get('conversation_id')
        if not await self.is_valid_conversation():
            await self.close(code=4003, reason="Invalid conversation")
            return

        self.conversation_group_name = f"conversation_{self.conversation_id}"
        await self.channel_layer.group_add(self.conversation_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.conversation_group_name, self.channel_name)

    async def receive(self, text_data):
        rate_key = f"chat_rate_{self.user.id}"
        message_count = cache.get(rate_key, 0)
        if message_count >= 10:
            await self.send(text_data=json.dumps({"error": "Rate limit exceeded"}))
            return
        cache.set(rate_key, message_count + 1, 60)

        try:
            data = json.loads(text_data)
            if "typing" in data:
                await self.channel_layer.group_send(
                    self.conversation_group_name,
                    {
                        "type": "typing_event",
                        "is_typing": data["typing"],
                    }
                )
                return

            message = data.get('message', '').strip()
            if not message or len(message) > 1000:
                await self.send(text_data=json.dumps({"error": "Invalid message"}))
                return

            message = await sync_to_async(self.sanitize_message)(message)
            msg = await self.save_message(message)
            await self.channel_layer.group_send(
                self.conversation_group_name,
                {
                    'type': 'chat_message',
                    'message': {
                        'message_id': str(msg.id),
                        'sender_id': self.user.id,
                        'message': message,
                        'timestamp': msg.created_at.isoformat(),
                        'sender_first_name': self.user.first_name,
                        'sender_last_name': self.user.last_name,
                        'sender_profile_picture': (
                            self.user.profile_picture.url if hasattr(self.user, 'profile_picture') and self.user.profile_picture else None
                        ),
                    }
                }
            )
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({"error": "Invalid JSON"}))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

    async def typing_event(self, event):
        await self.send(text_data=json.dumps({"is_typing": event["is_typing"]}))

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
    def is_valid_conversation(self):
        try:
            conversation = Conversation.objects.get(id=self.conversation_id)
            return self.user in (conversation.participant1, conversation.participant2)
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, message):
        conversation = Conversation.objects.get(id=self.conversation_id)
        return Message.objects.create(conversation=conversation, sender=self.user, message=message)

    def sanitize_message(self, message):
        message = re.sub(r'<[^>]+>', '', message)
        return ' '.join(message.split())