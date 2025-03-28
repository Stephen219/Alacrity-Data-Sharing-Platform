# datasets/routing.py
from django.urls import re_path
from . import consumers
from users import consumers as user_consumers

websocket_urlpatterns = [
    re_path(r'ws/datasets/chats/(?P<dataset_id>[^/]+)/messages/$', consumers.ChatConsumer.as_asgi()),
    re_path(r'ws/user/$', user_consumers.UserConsumer.as_asgi()),
]