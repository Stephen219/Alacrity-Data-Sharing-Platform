# datasets/routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/datasets/chats/(?P<dataset_id>[^/]+)/messages/$', consumers.ChatConsumer.as_asgi()),
]