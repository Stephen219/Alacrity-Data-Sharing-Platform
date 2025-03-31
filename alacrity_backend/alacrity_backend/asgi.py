import os
import django
import logging
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application

# Define a log directory and ensure it exists
log_dir = 'C:/Users/c22077065/final/alacrity/alacrity_backend/logs'
log_file = os.path.join(log_dir, 'asgi_debug.log')
os.makedirs(log_dir, exist_ok=True)

# Configure logging
logging.basicConfig(level=logging.DEBUG, filename=log_file, filemode='a')
logger = logging.getLogger('asgi')

logger.debug('Starting ASGI setup...')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alacrity_backend.settings')
logger.debug('DJANGO_SETTINGS_MODULE set to: %s', os.environ['DJANGO_SETTINGS_MODULE'])

logger.debug('Calling django.setup()...')
django.setup()
logger.debug('django.setup() completed.')

logger.debug('Importing datasets.routing...')
import datasets.routing
import users.routing
logger.debug('Importing users.routing...')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            datasets.routing.websocket_urlpatterns + users.routing.websocket_urlpatterns
        )
    ),
})
logger.debug('ASGI application initialized.')