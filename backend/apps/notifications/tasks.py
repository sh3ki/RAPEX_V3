"""RAPEX Notifications — Celery Tasks"""
import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(name='notifications.dispatch_notification')
def dispatch_notification(notification_id):
    """Send notification via FCM, WebSocket, etc."""
    from .models import Notification, FCMToken

    try:
        notif = Notification.objects.get(pk=notification_id)
    except Notification.DoesNotExist:
        return

    # 1. In-app via WebSocket
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        channel_layer = get_channel_layer()
        group_name = f"{notif.recipient_role.lower()}_{notif.recipient_id}"
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'notification.push',
                'data': {
                    'id': str(notif.id),
                    'event_type': notif.event_type,
                    'title': notif.title,
                    'body': notif.body,
                    'data': notif.data_payload,
                },
            },
        )
    except Exception as e:
        logger.warning(f"WebSocket send failed: {e}")

    # 2. FCM push
    tokens = FCMToken.objects.filter(
        owner_id=notif.recipient_id, is_active=True,
    ).values_list('fcm_token', flat=True)

    for token in tokens:
        try:
            import firebase_admin.messaging as fb_messaging
            message = fb_messaging.Message(
                notification=fb_messaging.Notification(
                    title=notif.title, body=notif.body,
                ),
                data={k: str(v) for k, v in (notif.data_payload or {}).items()},
                token=token,
            )
            fb_messaging.send(message)
        except Exception as e:
            logger.warning(f"FCM send failed for token {token[:20]}: {e}")

    notif.sent_at = timezone.now()
    notif.delivery_status = 'SENT'
    notif.save(update_fields=['sent_at', 'delivery_status', 'updated_at'])
