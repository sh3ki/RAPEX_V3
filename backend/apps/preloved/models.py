"""RAPEX Pre-Loved Module — Models"""
from django.db import models
from apps.core.models import BaseModel


class PrelovedCategory(BaseModel):
    store = models.ForeignKey('merchant.MerchantStore', on_delete=models.CASCADE, related_name='preloved_categories')
    name = models.CharField(max_length=100)

    class Meta:
        db_table = 'preloved_categories'

    def __str__(self):
        return self.name


class PrelovedItem(BaseModel):
    class Condition(models.TextChoices):
        NEW = 'NEW', 'New'
        LIKE_NEW = 'LIKE_NEW', 'Like New'
        GOOD = 'GOOD', 'Good'
        FAIR = 'FAIR', 'Fair'
        FOR_PARTS = 'FOR_PARTS', 'For Parts'

    class AvailabilityStatus(models.TextChoices):
        AVAILABLE = 'AVAILABLE', 'Available'
        RESERVED = 'RESERVED', 'Reserved'
        SOLD = 'SOLD', 'Sold'

    store = models.ForeignKey('merchant.MerchantStore', on_delete=models.CASCADE, related_name='preloved_items')
    category = models.ForeignKey(PrelovedCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='items')
    title = models.CharField(max_length=300)
    description = models.TextField()
    condition = models.CharField(max_length=20, choices=Condition.choices, default=Condition.GOOD)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    markup_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    final_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_negotiable = models.BooleanField(default=False)
    availability_status = models.CharField(max_length=20, choices=AvailabilityStatus.choices, default=AvailabilityStatus.AVAILABLE)
    delivery_available = models.BooleanField(default=True)
    images = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = 'preloved_items'

    def __str__(self):
        return f"{self.title} (₱{self.final_price})"

    def save(self, *args, **kwargs):
        from decimal import Decimal
        self.final_price = self.base_price * (1 + self.markup_rate / Decimal('100'))
        super().save(*args, **kwargs)


class PrelovedOffer(BaseModel):
    item = models.ForeignKey(PrelovedItem, on_delete=models.CASCADE, related_name='offers')
    buyer = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='preloved_offers')
    offered_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=[
        ('PENDING', 'Pending'), ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'), ('WITHDRAWN', 'Withdrawn'),
    ], default='PENDING')
    message = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'preloved_offers'

    def __str__(self):
        return f"Offer ₱{self.offered_price} on {self.item.title}"

