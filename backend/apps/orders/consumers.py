"""RAPEX Orders — WebSocket Consumers"""
import json
import logging
from channels.generic.websocket import AsyncJsonWebsocketConsumer

logger = logging.getLogger(__name__)


class OrderTrackingConsumer(AsyncJsonWebsocketConsumer):
    """Real-time order status updates for users, merchants, and riders."""

    async def connect(self):
        self.order_id = self.scope['url_route']['kwargs']['order_id']
        self.group_name = f'order_{self.order_id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def order_status_update(self, event):
        await self.send_json(event['data'])

    async def rider_location_update(self, event):
        await self.send_json({
            'type': 'rider_location',
            'lat': event['lat'],
            'lng': event['lng'],
        })

    async def rider_ping(self, event):
        await self.send_json({
            'type': 'rider_ping',
            **event['data'],
        })
