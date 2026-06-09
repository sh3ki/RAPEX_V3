"""RAPEX Notifications Module — Services"""
import logging

from django.utils import timezone

from .models import FCMToken, Notification

logger = logging.getLogger(__name__)

# Event templates
EVENT_TEMPLATES = {
    'order.new': {'title': 'New Order!', 'body': 'You have a new order #{order_number}.'},
    'order.accepted': {'title': 'Order Accepted', 'body': 'Your order #{order_number} has been accepted.'},
    'order.rejected': {'title': 'Order Rejected', 'body': 'Your order #{order_number} was rejected.'},
    'order.rider_assigned': {'title': 'Rider Assigned', 'body': 'A rider has been assigned to your order #{order_number}.'},
    'order.picked_up': {'title': 'Order Picked Up', 'body': 'Your order #{order_number} is on its way!'},
    'order.delivered': {'title': 'Order Delivered', 'body': 'Your order #{order_number} has been delivered.'},
    'order.cancelled': {'title': 'Order Cancelled', 'body': 'Order #{order_number} has been cancelled.'},
    'order.timeout_cancelled': {'title': 'Order Timed Out', 'body': 'Your order #{order_number} was auto-cancelled.'},
    'rider.ping': {'title': 'Delivery Request', 'body': 'New delivery available — ₱{total_amount}.'},
    'wallet.credited': {'title': 'Wallet Credited', 'body': '₱{amount} has been added to your wallet.'},
    'wallet.debited': {'title': 'Wallet Debited', 'body': '₱{amount} has been deducted from your wallet.'},
    'kyc.approved': {'title': 'KYC Approved', 'body': 'Your identity has been verified successfully.'},
    'kyc.rejected': {'title': 'KYC Rejected', 'body': 'Your KYC submission was rejected. Please resubmit.'},
    'points.earned': {'title': 'Points Earned', 'body': 'You earned {points} loyalty points!'},
    'referral.credited': {'title': 'Referral Bonus', 'body': 'You earned {points} points from a referral!'},
    'remittance.due_soon': {'title': 'Remittance Due Soon', 'body': 'Your remittance of ₱{amount} is due soon.'},
    'remittance.overdue': {'title': 'Remittance Overdue', 'body': 'Your remittance of ₱{amount} is overdue!'},
    'merchant.registered': {
        'title': 'New Merchant Registered',
        'body': '{merchant_display} created a merchant account and started onboarding.',
    },
    'merchant.onboarding_step_updated': {
        'title': 'Merchant Onboarding Updated',
        'body': '{merchant_display} updated their onboarding (step {step_label}).',
    },
    'merchant.onboarding_submitted': {
        'title': 'Merchant KYC Review Needed',
        'body': '{merchant_display} submitted onboarding details. Pending merchant KYC: {pending_kyc_count}.',
    },
    'system.broadcast': {'title': '{title}', 'body': '{body}'},
}


class NotificationService:

    @staticmethod
    def send(recipient_id, role, event_type, data=None):
        """Create notification and dispatch via Celery."""
        data = data or {}
        template = EVENT_TEMPLATES.get(event_type, {'title': event_type, 'body': ''})

        title = template['title']
        body = template['body']
        try:
            title = title.format(**data)
            body = body.format(**data)
        except (KeyError, IndexError):
            pass

        notification = Notification.objects.create(
            recipient_id=recipient_id,
            recipient_role=role,
            event_type=event_type,
            title=title,
            body=body,
            data_payload=data,
        )

        from .tasks import dispatch_notification
        dispatch_notification.delay(str(notification.id))

    @staticmethod
    def send_to_role(role, event_type, data=None):
        """Dispatch the same event to all active users of a role."""
        from apps.accounts.models import CustomUser

        recipient_ids = CustomUser.objects.filter(
            role=role,
            is_active=True,
            is_deleted=False,
        ).values_list('id', flat=True)

        for recipient_id in recipient_ids:
            NotificationService.send(recipient_id, role, event_type, data=data)

    @staticmethod
    def mark_read(notification_id, user_id):
        notification = Notification.objects.get(pk=notification_id, recipient_id=user_id)
        notification.read_at = timezone.now()
        notification.delivery_status = 'READ'
        notification.save(update_fields=['read_at', 'delivery_status', 'updated_at'])
        return notification
