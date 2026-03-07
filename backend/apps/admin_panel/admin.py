from django.contrib import admin
from .models import AdminAuditLog


@admin.register(AdminAuditLog)
class AdminAuditLogAdmin(admin.ModelAdmin):
    list_display = ['admin_id', 'action', 'target_type', 'target_id', 'created_at']
    list_filter = ['action', 'target_type']
    readonly_fields = ['admin_id', 'action', 'target_type', 'target_id', 'before_data', 'after_data', 'ip_address', 'created_at']

