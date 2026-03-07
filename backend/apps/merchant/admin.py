from django.contrib import admin
from .models import MerchantStore, StoreSchedule, MerchantMarkupOverride


@admin.register(MerchantStore)
class MerchantStoreAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'store_type', 'is_open', 'is_visible', 'merchant']
    list_filter = ['store_type', 'is_open', 'is_visible']


@admin.register(StoreSchedule)
class StoreScheduleAdmin(admin.ModelAdmin):
    list_display = ['store', 'day_of_week', 'open_time', 'close_time', 'is_closed']


@admin.register(MerchantMarkupOverride)
class MerchantMarkupOverrideAdmin(admin.ModelAdmin):
    list_display = ['merchant', 'store_type', 'tier_1_rate', 'tier_2_rate', 'tier_3_rate']

