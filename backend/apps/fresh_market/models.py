"""RAPEX Fresh Market Module — Models"""
from django.db import models
from apps.core.models import BaseModel


class FreshMarketCategory(BaseModel):
    store = models.ForeignKey('merchant.MerchantStore', on_delete=models.CASCADE, related_name='fresh_categories')
    name = models.CharField(max_length=100)
    display_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'fresh_market_categories'
        ordering = ['display_order']

    def __str__(self):
        return self.name


class FreshMarketProduct(BaseModel):
    class ApprovalStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    class ProductType(models.TextChoices):
        VEGETABLE = 'VEGETABLE', 'Vegetable'
        FRUIT = 'FRUIT', 'Fruit'
        RAW_MEAT = 'RAW_MEAT', 'Raw Meat'
        SEAFOOD = 'SEAFOOD', 'Seafood'
        POULTRY = 'POULTRY', 'Poultry'
        OTHER = 'OTHER', 'Other'

    class PricingMode(models.TextChoices):
        PER_PIECE = 'PER_PIECE', 'Per Piece'
        PER_KILO = 'PER_KILO', 'Per Kilo'
        PER_100G = 'PER_100G', 'Per 100g'
        PER_PACK = 'PER_PACK', 'Per Pack'
        PER_BUNDLE = 'PER_BUNDLE', 'Per Bundle'

    class FreshnessStatus(models.TextChoices):
        FRESH_TODAY = 'FRESH_TODAY', 'Fresh Today'
        LIMITED = 'LIMITED', 'Limited'
        OUT_OF_STOCK = 'OUT_OF_STOCK', 'Out of Stock'

    store = models.ForeignKey('merchant.MerchantStore', on_delete=models.CASCADE, related_name='fresh_products')
    category = models.ForeignKey(FreshMarketCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    name = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    product_type = models.CharField(max_length=20, choices=ProductType.choices, default=ProductType.OTHER)
    pricing_mode = models.CharField(max_length=20, choices=PricingMode.choices, default=PricingMode.PER_PIECE)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    markup_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    final_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    images = models.JSONField(default=list, blank=True)
    freshness_status = models.CharField(max_length=20, choices=FreshnessStatus.choices, default=FreshnessStatus.FRESH_TODAY)
    auto_reset_daily = models.BooleanField(default=False)
    merchant_notes = models.TextField(null=True, blank=True)
    stock_qty = models.IntegerField(default=0)
    is_available = models.BooleanField(default=True)
    approval_status = models.CharField(
        max_length=20,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.PENDING,
        db_index=True,
    )

    class Meta:
        db_table = 'fresh_market_products'

    def __str__(self):
        return f"{self.name} ({self.freshness_status})"

    def save(self, *args, **kwargs):
        from decimal import Decimal
        self.final_price = self.base_price * (1 + self.markup_rate / Decimal('100'))
        super().save(*args, **kwargs)

