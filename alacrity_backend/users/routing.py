
from django.urls import re_path
from .consumers import UserChatListConsumer , ChatConsumer

websocket_urlpatterns = [
    re_path(r'ws/users/chats/$', UserChatListConsumer.as_asgi()),
    re_path(r'ws/chat/(?P<conversation_id>\d+)/$', ChatConsumer.as_asgi()),  # Existing chat consumer
]