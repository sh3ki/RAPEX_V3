"""RAPEX Orders — Celery Tasks"""
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name='orders.cancel_order_if_not_accepted')
def cancel_order_if_not_accepted(order_id):
    """Auto-cancel PENDING_MERCHANT after 3 minutes."""
    from .models import Order, OrderStatusHistory

    try:
        order = Order.objects.get(pk=order_id, status='PENDING_MERCHANT')
    except Order.DoesNotExist:
        return  # Already processed

    order.status = 'TIMEOUT_CANCELLED'
    order.cancellation_reason = 'Merchant did not accept within 3 minutes.'
    order.save(update_fields=['status', 'cancellation_reason', 'updated_at'])

    OrderStatusHistory.objects.create(
        order=order,
        from_status='PENDING_MERCHANT',
        to_status='TIMEOUT_CANCELLED',
        changed_by_role='SYSTEM',
        note='Auto-cancelled by timeout',
    )
    logger.info(f"Order {order.order_number} auto-cancelled (timeout)")


@shared_task(name='orders.ping_available_riders')
def ping_available_riders(order_id):
    """Find riders within search radius with sufficient wallet balance."""
    from apps.accounts.models import RiderProfile
    from apps.wallet.models import RapexWallet
    from apps.settings_module.services import SettingsService
    from .models import Order

    try:
        order = Order.objects.select_related('store__merchant').get(pk=order_id)
    except Order.DoesNotExist:
        return

    if order.status not in ['PREPARING', 'COOKING', 'MERCHANT_ACCEPTED']:
        return

    radius_km = float(SettingsService.get('RIDER_SEARCH_RADIUS_KM', 5.0))
    merchant_lat = float(order.store.merchant.business_lat or 0)
    merchant_lng = float(order.store.merchant.business_lng or 0)

    online_riders = RiderProfile.objects.filter(
        is_online=True,
        kyc_status='APPROVED',
        current_lat__isnull=False,
        current_lng__isnull=False,
        is_deleted=False,
    )

    import math
    for rider in online_riders:
        # Distance check
        dlat = math.radians(float(rider.current_lat) - merchant_lat)
        dlng = math.radians(float(rider.current_lng) - merchant_lng)
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(merchant_lat)) *
             math.cos(math.radians(float(rider.current_lat))) *
             math.sin(dlng / 2) ** 2)
        dist_km = 6371.0 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        if dist_km > radius_km:
            continue

        # Wallet check
        try:
            wallet = RapexWallet.objects.get(owner_id=rider.user_id, owner_type='RIDER')
            if wallet.balance < order.total_amount:
                continue
        except RapexWallet.DoesNotExist:
            continue

        # Send WebSocket ping
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync

            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"rider_{rider.user_id}",
                {
                    'type': 'rider.ping',
                    'data': {
                        'order_id': str(order.id),
                        'order_number': order.order_number,
                        'merchant_address': order.store.merchant.business_address,
                        'customer_area': order.delivery_address or '',
                        'order_total': str(order.total_amount),
                        'delivery_fee': str(order.delivery_fee),
                    },
                },
            )
            logger.info(f"Rider ping sent to rider {rider.user_id} for order {order.order_number}")
        except Exception as e:
            logger.error(f"Failed to send rider ping: {e}")
