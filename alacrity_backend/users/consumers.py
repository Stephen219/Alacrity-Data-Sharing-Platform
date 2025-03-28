# users/consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework_simplejwt.tokens import AccessToken
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

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