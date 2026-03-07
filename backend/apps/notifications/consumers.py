"""RAPEX Notifications — WebSocket Consumer"""
import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    """Delivers real-time notifications to authenticated users."""

    async def connect(self):
        user = self.scope.get('user')
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
