# alacrity_backend/asgi.py
import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
import datasets.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alacrity_backend.settings')
django.setup()

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(datasets.routing.websocket_urlpatterns)
    ),
})