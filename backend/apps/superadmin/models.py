"""RAPEX SuperAdmin Module — Models"""
from django.db import models
from apps.core.models import BaseModel


class SuperAdminAuditLog(BaseModel):
    admin_id = models.UUIDField(db_index=True)
    action = models.CharField(max_length=200)
    target_type = models.CharField(max_length=50, blank=True)
    target_id = models.UUIDField(null=True, blank=True)
    before_data = models.JSONField(null=True, blank=True)
    after_data = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    device_fingerprint = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'superadmin_audit_log'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action} by SA {self.admin_id}"

