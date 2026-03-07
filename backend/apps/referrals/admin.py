from django.contrib import admin
from .models import ReferralCode, ReferralRecord, ReferralMonthlyTracker


@admin.register(ReferralCode)
class ReferralCodeAdmin(admin.ModelAdmin):
    list_display = ['code', 'owner_role', 'owner_id', 'total_used']
    search_fields = ['code']


@admin.register(ReferralRecord)
class ReferralRecordAdmin(admin.ModelAdmin):
    list_display = ['referral_code', 'referred_id', 'status', 'points_credited']
    list_filter = ['status']


@admin.register(ReferralMonthlyTracker)
class ReferralMonthlyTrackerAdmin(admin.ModelAdmin):
    list_display = ['owner_id', 'owner_role', 'month_year', 'points_credited']

