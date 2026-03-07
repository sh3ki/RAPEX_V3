"""RAPEX Settings Module — Models"""
import uuid

from django.db import models

from apps.core.models import BaseModel


class PlatformSetting(models.Model):
    class ValueType(models.TextChoices):
        STRING = 'STRING', 'String'
        INT = 'INT', 'Integer'
        FLOAT = 'FLOAT', 'Float'
        BOOL = 'BOOL', 'Boolean'
        JSON = 'JSON', 'JSON'

    key = models.CharField(max_length=100, unique=True, db_index=True)
    value = models.TextField()
    value_type = models.CharField(max_length=10, choices=ValueType.choices, default=ValueType.STRING)
    description = models.TextField(null=True, blank=True)
    last_updated_by = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'platform_settings'
        ordering = ['key']

    def __str__(self):
        return f"{self.key} = {self.value}"

    def get_typed_value(self):
        if self.value_type == self.ValueType.INT:
            return int(self.value)
        elif self.value_type == self.ValueType.FLOAT:
            return float(self.value)
        elif self.value_type == self.ValueType.BOOL:
            return self.value.lower() in ('true', '1', 'yes')
        elif self.value_type == self.ValueType.JSON:
            import json
            return json.loads(self.value)
        return self.value


class MarkupTier(BaseModel):
    class StoreType(models.TextChoices):
        ALL = 'ALL', 'All'
        SHOP = 'SHOP', 'Shop'
        FRESH_MARKET = 'FRESH_MARKET', 'Fresh Market'
        READY_TO_EAT = 'READY_TO_EAT', 'Ready to Eat'
        PRELOVED = 'PRELOVED', 'Pre-Loved'

    store_type = models.CharField(max_length=20, choices=StoreType.choices, default=StoreType.ALL)
    price_min = models.DecimalField(max_digits=12, decimal_places=2)
    price_max = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    markup_rate = models.DecimalField(max_digits=5, decimal_places=2, help_text='e.g. 5.00 = 5%')

    class Meta:
        db_table = 'markup_tiers'
        ordering = ['store_type', 'price_min']
        unique_together = ['store_type', 'price_min']

    def __str__(self):
        mx = f"₱{self.price_max}" if self.price_max else "∞"
        return f"{self.store_type} ₱{self.price_min}-{mx} → {self.markup_rate}%"


class CommissionTier(BaseModel):
    class StoreType(models.TextChoices):
        ALL = 'ALL', 'All'
        SHOP = 'SHOP', 'Shop'
        FRESH_MARKET = 'FRESH_MARKET', 'Fresh Market'
        READY_TO_EAT = 'READY_TO_EAT', 'Ready to Eat'
        PRELOVED = 'PRELOVED', 'Pre-Loved'

    store_type = models.CharField(max_length=20, choices=StoreType.choices, default=StoreType.ALL)
    price_min = models.DecimalField(max_digits=12, decimal_places=2)
    price_max = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, help_text='e.g. 10.00 = 10%')

    class Meta:
        db_table = 'commission_tiers'
        ordering = ['store_type', 'price_min']
        unique_together = ['store_type', 'price_min']

    def __str__(self):
        mx = f"₱{self.price_max}" if self.price_max else "∞"
        return f"{self.store_type} ₱{self.price_min}-{mx} → {self.commission_rate}%"

