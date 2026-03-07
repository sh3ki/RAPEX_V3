from django.contrib import admin
from .models import SuperAdminAuditLog


@admin.register(SuperAdminAuditLog)
class SuperAdminAuditLogAdmin(admin.ModelAdmin):
    list_display = ['admin_id', 'action', 'target_type', 'target_id', 'created_at']
    readonly_fields = [
        'admin_id', 'action', 'target_type', 'target_id',
        'before_data', 'after_data', 'ip_address', 'device_fingerprint', 'created_at',
    ]

