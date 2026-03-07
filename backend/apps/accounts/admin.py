from django.contrib import admin
from .models import (
    CustomUser, SuperAdminProfile, AdminProfile,
    MerchantProfile, RiderProfile, UserProfile, OTPRecord,
)


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ['phone', 'role', 'is_active', 'is_verified', 'date_joined']
    list_filter = ['role', 'is_active', 'is_verified']
    search_fields = ['phone', 'email']


@admin.register(SuperAdminProfile)
class SuperAdminProfileAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'user']


@admin.register(AdminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'sub_role', 'user']
    list_filter = ['sub_role']


@admin.register(MerchantProfile)
class MerchantProfileAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'business_name', 'kyc_status']
    list_filter = ['kyc_status']


@admin.register(RiderProfile)
class RiderProfileAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'vehicle_type', 'kyc_status', 'is_online']
    list_filter = ['kyc_status', 'vehicle_type', 'is_online']


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'kyc_status']
    list_filter = ['kyc_status']


@admin.register(OTPRecord)
class OTPRecordAdmin(admin.ModelAdmin):
    list_display = ['phone', 'purpose', 'is_used', 'expires_at', 'created_at']
    list_filter = ['purpose', 'is_used']
