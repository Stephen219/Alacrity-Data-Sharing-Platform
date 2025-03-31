import os
import django
import logging
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
import datasets.routing

logging.basicConfig(level=logging.DEBUG, filename='/tmp/asgi_debug.log', filemode='a')
logger = logging.getLogger('asgi')

logger.debug('Starting ASGI setup...')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alacrity_backend.settings')
logger.debug('DJANGO_SETTINGS_MODULE set to: %s', os.environ['DJANGO_SETTINGS_MODULE'])

logger.debug('Calling django.setup()...')
django.setup()
logger.debug('django.setup() completed.')

logger.debug('Importing datasets.routing...')
application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': AuthMiddlewareStack(
        URLRouter(datasets.routing.websocket_urlpatterns)
    ),
})
logger.debug('ASGI application initialized.')