"""RAPEX Notifications Module — Models"""
from django.db import models
from apps.core.models import BaseModel


class Notification(BaseModel):
    ROLE_CHOICES = [
        ('USER', 'User'), ('MERCHANT', 'Merchant'), ('RIDER', 'Rider'),
        ('ADMIN', 'Admin'), ('SUPERADMIN', 'Super Admin'),
    ]
    CHANNEL_CHOICES = [
        ('PUSH_FCM', 'FCM Push'), ('WEB_PUSH', 'Web Push'),
        ('IN_APP', 'In-App'), ('SMS', 'SMS'), ('EMAIL', 'Email'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'), ('SENT', 'Sent'),
        ('DELIVERED', 'Delivered'), ('FAILED', 'Failed'), ('READ', 'Read'),
    ]

    recipient_id = models.UUIDField(db_index=True)
    recipient_role = models.CharField(max_length=15, choices=ROLE_CHOICES)
    channel = models.CharField(max_length=15, choices=CHANNEL_CHOICES, default='PUSH_FCM')
    event_type = models.CharField(max_length=100, db_index=True)
    title = models.CharField(max_length=200)
    body = models.TextField()
    data_payload = models.JSONField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    delivery_status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    error_message = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.event_type} → {self.recipient_id}"


class FCMToken(BaseModel):
    ROLE_CHOICES = [
        ('USER', 'User'), ('MERCHANT', 'Merchant'), ('RIDER', 'Rider'),
        ('ADMIN', 'Admin'), ('SUPERADMIN', 'Super Admin'),
    ]
    owner_id = models.UUIDField(db_index=True)
    owner_role = models.CharField(max_length=15, choices=ROLE_CHOICES)
    device_id = models.CharField(max_length=255)
    fcm_token = models.TextField()
    is_active = models.BooleanField(default=True)
    last_active = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'fcm_tokens'
        unique_together = ['owner_id', 'device_id']

    def __str__(self):
        return f"FCM {self.owner_role}:{self.owner_id}"

