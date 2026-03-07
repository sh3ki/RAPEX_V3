"""RAPEX Orders Module — Models"""
import uuid
from django.db import models
from django.utils import timezone
from apps.core.models import BaseModel


class Order(BaseModel):
    class Status(models.TextChoices):
        PENDING_MERCHANT = 'PENDING_MERCHANT', 'Pending Merchant'
        MERCHANT_ACCEPTED = 'MERCHANT_ACCEPTED', 'Merchant Accepted'
        PREPARING = 'PREPARING', 'Preparing'
        COOKING = 'COOKING', 'Cooking'
        FOR_PICKUP = 'FOR_PICKUP', 'For Pickup'
        READY_FOR_PICKUP = 'READY_FOR_PICKUP', 'Ready for Pickup'
        RIDER_ASSIGNED = 'RIDER_ASSIGNED', 'Rider Assigned'
        PICKED_UP = 'PICKED_UP', 'Picked Up'
        IN_TRANSIT = 'IN_TRANSIT', 'In Transit'
        DELIVERED = 'DELIVERED', 'Delivered'
        CANCELLED = 'CANCELLED', 'Cancelled'
        TIMEOUT_CANCELLED = 'TIMEOUT_CANCELLED', 'Timeout Cancelled'
        FAILED = 'FAILED', 'Failed'

    class DeliveryMethod(models.TextChoices):
        DELIVERY = 'DELIVERY', 'Delivery'
        PICKUP = 'PICKUP', 'Pickup'

    class DeliverySpeed(models.TextChoices):
        STANDARD = 'STANDARD', 'Standard'
        SAVER = 'SAVER', 'Saver'

    class StoreType(models.TextChoices):
        SHOP = 'SHOP', 'Shop'
        FRESH_MARKET = 'FRESH_MARKET', 'Fresh Market'
        READY_TO_EAT = 'READY_TO_EAT', 'Ready to Eat'
        PRELOVED = 'PRELOVED', 'Pre-Loved'

    VALID_TRANSITIONS = {
        'PENDING_MERCHANT': ['MERCHANT_ACCEPTED', 'TIMEOUT_CANCELLED', 'CANCELLED'],
        'MERCHANT_ACCEPTED': ['PREPARING', 'COOKING', 'RIDER_ASSIGNED'],
        'PREPARING': ['FOR_PICKUP', 'RIDER_ASSIGNED'],
        'COOKING': ['READY_FOR_PICKUP', 'RIDER_ASSIGNED'],
        'FOR_PICKUP': ['PICKED_UP'],
        'READY_FOR_PICKUP': ['PICKED_UP'],
        'RIDER_ASSIGNED': ['FOR_PICKUP', 'READY_FOR_PICKUP', 'PICKED_UP'],
        'PICKED_UP': ['IN_TRANSIT'],
        'IN_TRANSIT': ['DELIVERED', 'FAILED'],
        'DELIVERED': [],
        'CANCELLED': [],
        'TIMEOUT_CANCELLED': [],
        'FAILED': [],
    }

    order_number = models.CharField(max_length=20, unique=True, editable=False)
    user = models.ForeignKey('accounts.UserProfile', on_delete=models.CASCADE, related_name='orders')
    merchant = models.ForeignKey('accounts.MerchantProfile', on_delete=models.CASCADE, related_name='orders')
    store = models.ForeignKey('merchant.MerchantStore', on_delete=models.CASCADE, related_name='orders')
    store_type = models.CharField(max_length=20, choices=StoreType.choices)
    rider = models.ForeignKey('accounts.RiderProfile', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING_MERCHANT)
    delivery_method = models.CharField(max_length=10, choices=DeliveryMethod.choices, default=DeliveryMethod.DELIVERY)
    vehicle_type = models.CharField(max_length=20, null=True, blank=True)
    delivery_speed = models.CharField(max_length=10, choices=DeliverySpeed.choices, null=True, blank=True)
    delivery_address = models.TextField(null=True, blank=True)
    delivery_lat = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    delivery_lng = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    points_discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    markup_collected = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    platform_commission = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    rapex_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    merchant_accept_deadline = models.DateTimeField(null=True, blank=True)
    pickup_confirmed_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(null=True, blank=True)
    special_notes = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.order_number} ({self.status})"

    def save(self, *args, **kwargs):
        if not self.order_number:
            date_str = timezone.now().strftime('%Y%m%d')
            count = Order.objects.filter(
                created_at__date=timezone.now().date(),
            ).count() + 1
            self.order_number = f"ORD-{date_str}-{count:04d}"
        super().save(*args, **kwargs)

    def can_transition_to(self, new_status: str) -> bool:
        return new_status in self.VALID_TRANSITIONS.get(self.status, [])


class OrderItem(BaseModel):
    class ProductType(models.TextChoices):
        SHOP = 'SHOP', 'Shop'
        FRESH = 'FRESH', 'Fresh Market'
        FOOD = 'FOOD', 'Ready to Eat'
        PRELOVED = 'PRELOVED', 'Pre-Loved'

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product_id = models.UUIDField()
    product_type = models.CharField(max_length=20, choices=ProductType.choices)
    product_name = models.CharField(max_length=300)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.DecimalField(max_digits=8, decimal_places=3, default=1)
    line_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    add_ons = models.JSONField(null=True, blank=True)
    special_note = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'order_items'

    def __str__(self):
        return f"{self.product_name} x{self.quantity}"

    def save(self, *args, **kwargs):
        self.line_total = self.unit_price * self.quantity
        super().save(*args, **kwargs)


class OrderStatusHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    from_status = models.CharField(max_length=20)
    to_status = models.CharField(max_length=20)
    changed_by_role = models.CharField(max_length=20, choices=[
        ('SYSTEM', 'System'), ('MERCHANT', 'Merchant'), ('RIDER', 'Rider'),
        ('ADMIN', 'Admin'), ('USER', 'User'),
    ])
    changed_by_id = models.UUIDField(null=True, blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    note = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'order_status_history'
        ordering = ['-changed_at']

    def __str__(self):
        return f"{self.order_id}: {self.from_status} → {self.to_status}"

