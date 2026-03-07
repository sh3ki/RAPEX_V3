"""RAPEX Messaging — WebSocket Consumer"""
from channels.generic.websocket import AsyncJsonWebsocketConsumer


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """Real-time chat for admin ↔ participant threads."""

    async def connect(self):
        self.thread_id = self.scope['url_route']['kwargs']['thread_id']
        self.group_name = f'chat_thread_{self.thread_id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def chat_message(self, event):
        await self.send_json(event['data'])
