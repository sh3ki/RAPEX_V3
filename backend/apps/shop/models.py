"""RAPEX Shop Module — Models"""
from django.db import models
from apps.core.models import BaseModel


class ShopCategory(BaseModel):
    store = models.ForeignKey('merchant.MerchantStore', on_delete=models.CASCADE, related_name='shop_categories')
    name = models.CharField(max_length=100)
    display_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'shop_categories'
        ordering = ['display_order']

    def __str__(self):
        return self.name


class ShopProduct(BaseModel):
    store = models.ForeignKey('merchant.MerchantStore', on_delete=models.CASCADE, related_name='shop_products')
    category = models.ForeignKey(ShopCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    name = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    markup_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    final_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    images = models.JSONField(default=list, blank=True)
    has_inventory = models.BooleanField(default=False)
    stock_qty = models.IntegerField(default=0)
    is_available = models.BooleanField(default=True)
    is_on_promo = models.BooleanField(default=False)
    promo_original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'shop_products'

    def __str__(self):
        return f"{self.name} (₱{self.final_price})"

    def save(self, *args, **kwargs):
        from decimal import Decimal
        self.final_price = self.base_price * (1 + self.markup_rate / Decimal('100'))
        if self.has_inventory and self.stock_qty <= 0:
            self.is_available = False
        super().save(*args, **kwargs)

