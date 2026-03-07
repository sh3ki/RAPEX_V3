"""RAPEX Orders Module — Services"""
import logging
import math
from datetime import timedelta
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from apps.core.exceptions import (
    GPSValidationFailed,
    OrderNotCancellable,
    RapexAPIException,
    StoreCurrentlyClosed,
)
from apps.settings_module.services import SettingsService

from .models import Order, OrderItem, OrderStatusHistory

logger = logging.getLogger(__name__)


class OrderService:

    @staticmethod
    @transaction.atomic
    def place_order(user, validated_data: dict) -> Order:
        """Place a new order."""
        from apps.merchant.models import MerchantStore

        store = MerchantStore.objects.get(pk=validated_data['store_id'])
        if not store.is_open:
            raise StoreCurrentlyClosed()

        # Calculate items
        items_data = validated_data.get('items', [])
        subtotal = Decimal('0')
        markup_total = Decimal('0')

        for item in items_data:
            item['line_total'] = item['unit_price'] * item['quantity']
            subtotal += item['line_total']

        # Calculate delivery fee
        distance_km = validated_data.get('distance_km', 0)
        delivery_fee = Decimal('0')
        if validated_data.get('delivery_method') == 'DELIVERY':
            delivery_fee = SettingsService.calculate_delivery_fare(
                validated_data.get('vehicle_type', 'MOTORCYCLE'),
                validated_data.get('delivery_speed', 'STANDARD'),
                distance_km,
            )

        # Points discount
        points_discount = Decimal(str(validated_data.get('points_discount', 0)))

        # Commission
        commission_rate = Decimal('10.00')
        commission_amount = (subtotal * commission_rate / Decimal('100')).quantize(Decimal('0.01'))
        rapex_fee = (commission_amount * Decimal('0.10')).quantize(Decimal('0.01'))

        total_amount = subtotal + delivery_fee - points_discount

        # Create order
        deadline = timezone.now() + timedelta(seconds=180)
        order = Order.objects.create(
            user=user.userprofile,
            merchant=store.merchant,
            store=store,
            store_type=store.store_type,
            status='PENDING_MERCHANT',
            delivery_method=validated_data.get('delivery_method', 'DELIVERY'),
            vehicle_type=validated_data.get('vehicle_type'),
            delivery_speed=validated_data.get('delivery_speed'),
            delivery_address=validated_data.get('delivery_address'),
            delivery_lat=validated_data.get('delivery_lat'),
            delivery_lng=validated_data.get('delivery_lng'),
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            points_discount=points_discount,
            total_amount=total_amount,
            markup_collected=markup_total,
            commission_rate=commission_rate,
            platform_commission=commission_amount,
            rapex_fee=rapex_fee,
            merchant_accept_deadline=deadline,
            special_notes=validated_data.get('special_notes'),
        )

        # Create order items
        for item in items_data:
            OrderItem.objects.create(
                order=order,
                product_id=item['product_id'],
                product_type=item['product_type'],
                product_name=item['product_name'],
                unit_price=item['unit_price'],
                quantity=item['quantity'],
                line_total=item['line_total'],
                add_ons=item.get('add_ons'),
                special_note=item.get('special_note'),
            )

        # Log status
        OrderStatusHistory.objects.create(
            order=order,
            from_status='',
            to_status='PENDING_MERCHANT',
            changed_by_role='USER',
            changed_by_id=user.id,
        )

        # Schedule auto-cancel Celery task
        from .tasks import cancel_order_if_not_accepted
        cancel_order_if_not_accepted.apply_async(
            args=[str(order.id)], countdown=180,
        )

        logger.info(f"Order placed: {order.order_number}")
        return order

    @staticmethod
    @transaction.atomic
    def accept_order(order: Order, merchant_user):
        if order.status != 'PENDING_MERCHANT':
            raise RapexAPIException('Order is not pending.', code='invalid_status')

        new_status = 'COOKING' if order.store_type == 'READY_TO_EAT' else 'PREPARING'
        OrderService._transition(order, new_status, 'MERCHANT', merchant_user.id)

        # Schedule rider ping
        from .tasks import ping_available_riders
        ping_available_riders.apply_async(args=[str(order.id)], countdown=5)

        logger.info(f"Order {order.order_number} accepted by merchant")
        return order

    @staticmethod
    @transaction.atomic
    def reject_order(order: Order, merchant_user, reason: str):
        if order.status != 'PENDING_MERCHANT':
            raise RapexAPIException('Order is not pending.', code='invalid_status')

        order.cancellation_reason = reason
        OrderService._transition(order, 'CANCELLED', 'MERCHANT', merchant_user.id, note=reason)
        logger.info(f"Order {order.order_number} rejected")
        return order

    @staticmethod
    @transaction.atomic
    def cancel_order(order: Order, user, reason: str = ''):
        if order.status not in ['PENDING_MERCHANT']:
            raise OrderNotCancellable()

        order.cancellation_reason = reason
        OrderService._transition(order, 'CANCELLED', 'USER', user.id, note=reason)
        logger.info(f"Order {order.order_number} cancelled by user")
        return order

    @staticmethod
    @transaction.atomic
    def assign_rider(order: Order, rider):
        from apps.wallet.services import WalletService

        balance = WalletService.get_balance(rider.user_id, 'RIDER')
        if balance < order.total_amount:
            raise RapexAPIException('Rider wallet insufficient.', code='insufficient_balance')

        order.rider = rider
        OrderService._transition(order, 'RIDER_ASSIGNED', 'SYSTEM', note='Rider auto-assigned')
        logger.info(f"Rider {rider.id} assigned to order {order.order_number}")
        return order

    @staticmethod
    @transaction.atomic
    def pickup_confirmed(order: Order, merchant_user):
        if order.status not in ['FOR_PICKUP', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED']:
            raise RapexAPIException('Invalid status for pickup.', code='invalid_status')

        from apps.wallet.services import WalletService
        WalletService.process_order_payment(order.rider_id, order)

        order.pickup_confirmed_at = timezone.now()
        OrderService._transition(order, 'PICKED_UP', 'MERCHANT', merchant_user.id)
        OrderService._transition(order, 'IN_TRANSIT', 'SYSTEM')
        logger.info(f"Order {order.order_number} picked up")
        return order

    @staticmethod
    @transaction.atomic
    def mark_delivered(order: Order, rider_user, lat: float, lng: float):
        if order.status != 'IN_TRANSIT':
            raise RapexAPIException('Order not in transit.', code='invalid_status')

        # GPS validation
        gps_radius = int(SettingsService.get('GPS_DELIVERY_RADIUS_M', 50))
        distance = OrderService._haversine_distance(
            lat, lng,
            float(order.delivery_lat), float(order.delivery_lng),
        )
        if distance > gps_radius:
            raise GPSValidationFailed()

        from apps.wallet.services import WalletService
        WalletService.deduct_commission(order.rider_id, order)
        WalletService.credit_delivery_fee(order.rider_id, order, order.delivery_fee)

        order.delivered_at = timezone.now()
        OrderService._transition(order, 'DELIVERED', 'RIDER', rider_user.id)

        # Credit loyalty points after 30s delay
        from apps.wallet.tasks import credit_loyalty_points_delayed
        credit_loyalty_points_delayed.apply_async(
            args=[str(order.user.user_id), str(order.id)], countdown=30,
        )

        logger.info(f"Order {order.order_number} delivered")
        return order

    @staticmethod
    def _transition(order: Order, new_status: str, role: str, user_id=None, note=None):
        old_status = order.status
        order.status = new_status
        order.save(update_fields=['status', 'updated_at', 'cancellation_reason',
                                   'pickup_confirmed_at', 'delivered_at', 'rider'])

        OrderStatusHistory.objects.create(
            order=order,
            from_status=old_status,
            to_status=new_status,
            changed_by_role=role,
            changed_by_id=user_id,
            note=note,
        )

    @staticmethod
    def _haversine_distance(lat1, lng1, lat2, lng2) -> float:
        """Return distance in meters."""
        R = 6371000
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlng / 2) ** 2)
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
