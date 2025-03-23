import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
import datasets.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alacrity_backend.settings')
django.setup()

# Define the Django ASGI app
django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            datasets.routing.websocket_urlpatterns
        )
    ),
})
