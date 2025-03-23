# datasets/routing.py
from django.urls import path
from .consumers import ChatConsumer

websocket_urlpatterns = [
    # Match the URL pattern used in frontend
    path('ws/chats/<str:dataset_id>/', ChatConsumer.as_asgi()),
]