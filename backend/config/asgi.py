"""
RAPEX — ASGI Configuration (Django Channels + WebSocket)
"""
import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

django_asgi_app = get_asgi_application()

# Import routing after Django setup
from apps.orders.routing import websocket_urlpatterns as order_ws  # noqa: E402
from apps.messaging.routing import websocket_urlpatterns as chat_ws  # noqa: E402
from apps.notifications.routing import websocket_urlpatterns as notification_ws  # noqa: E402

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                order_ws + chat_ws + notification_ws
            )
        )
    ),
})
