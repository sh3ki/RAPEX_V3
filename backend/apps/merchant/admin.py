from django.contrib import admin
from .models import (
    MerchantStore,
    StoreSchedule,
    MerchantMarkupOverride,
    MerchantCountryCode,
    MerchantBusinessCategory,
    MerchantBusinessType,
    MerchantBusinessProfile,
    MerchantLocation,
    MerchantDocument,
    MerchantOnboardingState,
)


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


@admin.register(MerchantCountryCode)
class MerchantCountryCodeAdmin(admin.ModelAdmin):
    list_display = ['country_name', 'country_code', 'country_flag_emoji', 'max_digits', 'is_default', 'is_active']
    list_filter = ['is_default', 'is_active']
    search_fields = ['country_name', 'country_code']


@admin.register(MerchantBusinessCategory)
class MerchantBusinessCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active']
    search_fields = ['name']


@admin.register(MerchantBusinessType)
class MerchantBusinessTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'category__name']


@admin.register(MerchantBusinessProfile)
class MerchantBusinessProfileAdmin(admin.ModelAdmin):
    list_display = ['merchant', 'business_name', 'registration_type']
    list_filter = ['registration_type']
    search_fields = ['business_name', 'merchant__full_name']


@admin.register(MerchantLocation)
class MerchantLocationAdmin(admin.ModelAdmin):
    list_display = ['merchant', 'barangay', 'city_municipality', 'province', 'zip_code']
    search_fields = ['merchant__full_name', 'barangay', 'city_municipality', 'province']


@admin.register(MerchantDocument)
class MerchantDocumentAdmin(admin.ModelAdmin):
    list_display = ['merchant', 'document_type', 'is_optional', 'is_verified', 'created_at']
    list_filter = ['document_type', 'is_optional', 'is_verified']
    search_fields = ['merchant__full_name', 'file_url']


@admin.register(MerchantOnboardingState)
class MerchantOnboardingStateAdmin(admin.ModelAdmin):
    list_display = [
        'merchant',
        'current_step',
        'is_submitted',
        'email_verified',
        'phone_verified',
        'can_resubmit',
    ]
    list_filter = ['is_submitted', 'email_verified', 'phone_verified', 'can_resubmit']

