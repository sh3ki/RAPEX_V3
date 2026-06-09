"""RAPEX Notifications — WebSocket Consumer"""
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from rest_framework_simplejwt.tokens import AccessToken


@database_sync_to_async
def _get_user_from_token(token: str):
    from apps.accounts.models import CustomUser

    try:
        payload = AccessToken(token)
    except Exception:
        return None

    user_id = payload.get('user_id')
    if not user_id:
        return None

    return CustomUser.objects.filter(id=user_id, is_active=True, is_deleted=False).first()


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    """Delivers real-time notifications to authenticated users."""

    async def connect(self):
        user = self.scope.get('user')

        if not (user and user.is_authenticated):
            raw_query = (self.scope.get('query_string') or b'').decode('utf-8')
            token = parse_qs(raw_query).get('token', [None])[0]
            if token:
                user = await _get_user_from_token(token)

        if user and user.is_authenticated:
            self.group_name = f"{user.role.lower()}_{user.id}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def notification_push(self, event):
        await self.send_json(event['data'])
