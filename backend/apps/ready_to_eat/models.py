"""RAPEX Ready-to-Eat Module — Models"""
from django.db import models
from apps.core.models import BaseModel


class MenuCategory(BaseModel):
    store = models.ForeignKey('merchant.MerchantStore', on_delete=models.CASCADE, related_name='menu_categories')
    name = models.CharField(max_length=100)
    display_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'menu_categories'
        ordering = ['display_order']

    def __str__(self):
        return self.name


class MenuItem(BaseModel):
    class ApprovalStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    store = models.ForeignKey('merchant.MerchantStore', on_delete=models.CASCADE, related_name='menu_items')
    category = models.ForeignKey(MenuCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='items')
    name = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    images = models.JSONField(default=list, blank=True)
    is_available = models.BooleanField(default=True)
    is_sold_out = models.BooleanField(default=False)
    approval_status = models.CharField(
        max_length=20,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.PENDING,
        db_index=True,
    )

    class Meta:
        db_table = 'menu_items'

    def __str__(self):
        return self.name


class MenuItemVariant(BaseModel):
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name='variants')
    name = models.CharField(max_length=100, help_text='e.g. Solo, Family')
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    markup_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    final_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_available = models.BooleanField(default=True)

    class Meta:
        db_table = 'menu_item_variants'

    def __str__(self):
        return f"{self.menu_item.name} - {self.name} (₱{self.final_price})"

    def save(self, *args, **kwargs):
        from decimal import Decimal
        self.final_price = self.base_price * (1 + self.markup_rate / Decimal('100'))
        super().save(*args, **kwargs)


class MenuItemAddon(BaseModel):
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name='addons')
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text='Flat price, no markup')
    is_available = models.BooleanField(default=True)

    class Meta:
        db_table = 'menu_item_addons'

    def __str__(self):
        return f"{self.name} (+₱{self.price})"


class ReadyToEatStoreSettings(models.Model):
    store = models.OneToOneField('merchant.MerchantStore', on_delete=models.CASCADE, related_name='rte_settings')
    default_prep_time_minutes = models.IntegerField(default=15)

    class Meta:
        db_table = 'ready_to_eat_store_settings'

    def __str__(self):
        return f"RTE Settings for {self.store.display_name}"

