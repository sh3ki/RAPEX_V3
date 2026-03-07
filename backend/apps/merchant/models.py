"""RAPEX Merchant Module — Models"""
from django.db import models
from apps.core.models import BaseModel


class MerchantStore(BaseModel):
    class StoreType(models.TextChoices):
        SHOP = 'SHOP', 'Shop'
        FRESH_MARKET = 'FRESH_MARKET', 'Fresh Market'
        READY_TO_EAT = 'READY_TO_EAT', 'Ready to Eat'
        PRELOVED = 'PRELOVED', 'Pre-Loved'

    merchant = models.ForeignKey(
        'accounts.MerchantProfile', on_delete=models.CASCADE, related_name='stores'
    )
    store_type = models.CharField(max_length=20, choices=StoreType.choices)
    display_name = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    logo_url = models.CharField(max_length=500, null=True, blank=True)
    banner_url = models.CharField(max_length=500, null=True, blank=True)
    is_open = models.BooleanField(default=False)
    is_visible = models.BooleanField(default=True)
    is_accepting_delivery = models.BooleanField(default=True)
    is_accepting_pickup = models.BooleanField(default=True)
    tags = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = 'merchant_stores'
        unique_together = ['merchant', 'store_type']

    def __str__(self):
        return f"{self.display_name} ({self.store_type})"


class StoreSchedule(models.Model):
    id = models.UUIDField(primary_key=True, default=None, editable=False)
    store = models.ForeignKey(MerchantStore, on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.SmallIntegerField(help_text='0=Monday, 6=Sunday')
    open_time = models.TimeField(null=True, blank=True)
    close_time = models.TimeField(null=True, blank=True)
    is_closed = models.BooleanField(default=False)

    class Meta:
        db_table = 'store_schedules'
        unique_together = ['store', 'day_of_week']

    def save(self, *args, **kwargs):
        if not self.id:
            import uuid
            self.id = uuid.uuid4()
        super().save(*args, **kwargs)

    def __str__(self):
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        return f"{self.store.display_name} - {days[self.day_of_week]}"


class MerchantMarkupOverride(BaseModel):
    merchant = models.ForeignKey(
        'accounts.MerchantProfile', on_delete=models.CASCADE, related_name='markup_overrides'
    )
    store_type = models.CharField(
        max_length=20, choices=MerchantStore.StoreType.choices, null=True, blank=True,
        help_text='NULL = applies to all stores',
    )
    tier_1_rate = models.DecimalField(max_digits=5, decimal_places=2, help_text='₱1-₱100')
    tier_2_rate = models.DecimalField(max_digits=5, decimal_places=2, help_text='₱101-₱1000')
    tier_3_rate = models.DecimalField(max_digits=5, decimal_places=2, help_text='₱1001+')
    set_by_admin = models.ForeignKey(
        'accounts.AdminProfile', on_delete=models.SET_NULL, null=True, related_name='+'
    )
    reason = models.TextField()

    class Meta:
        db_table = 'merchant_markup_overrides'

    def __str__(self):
        return f"Override for {self.merchant} ({self.store_type or 'ALL'})"

