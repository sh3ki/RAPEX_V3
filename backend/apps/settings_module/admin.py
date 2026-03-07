from django.contrib import admin
from .models import PlatformSetting, MarkupTier, CommissionTier


@admin.register(PlatformSetting)
class PlatformSettingAdmin(admin.ModelAdmin):
    list_display = ['key', 'value', 'value_type', 'updated_at']
    search_fields = ['key']
    list_filter = ['value_type']


@admin.register(MarkupTier)
class MarkupTierAdmin(admin.ModelAdmin):
    list_display = ['store_type', 'price_min', 'price_max', 'markup_rate']
    list_filter = ['store_type']


@admin.register(CommissionTier)
class CommissionTierAdmin(admin.ModelAdmin):
    list_display = ['store_type', 'price_min', 'price_max', 'commission_rate']
    list_filter = ['store_type']

