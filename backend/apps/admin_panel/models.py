"""RAPEX Admin Panel — Models
Admin/SuperAdmin profiles live in accounts module.
This module holds audit-specific models."""
from django.db import models
from apps.core.models import BaseModel


class AdminAuditLog(BaseModel):
    admin_id = models.UUIDField(db_index=True)
    action = models.CharField(max_length=200)
    target_type = models.CharField(max_length=50, blank=True)
    target_id = models.UUIDField(null=True, blank=True)
    before_data = models.JSONField(null=True, blank=True)
    after_data = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table = 'admin_audit_log'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action} by {self.admin_id}"

