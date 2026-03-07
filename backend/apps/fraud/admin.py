from django.contrib import admin
from .models import FraudFlag, InvestigationCase, AccountBlacklist


@admin.register(FraudFlag)
class FraudFlagAdmin(admin.ModelAdmin):
    list_display = ['flag_type', 'subject_role', 'subject_id', 'resolution', 'auto_flagged', 'created_at']
    list_filter = ['flag_type', 'resolution', 'auto_flagged']


@admin.register(InvestigationCase)
class InvestigationCaseAdmin(admin.ModelAdmin):
    list_display = ['case_number', 'title', 'priority', 'status', 'created_at']
    list_filter = ['priority', 'status']


@admin.register(AccountBlacklist)
class AccountBlacklistAdmin(admin.ModelAdmin):
    list_display = ['subject_role', 'subject_id', 'is_permanent', 'created_at']

