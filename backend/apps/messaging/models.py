"""RAPEX Messaging Module — Models"""
from django.db import models
from apps.core.models import BaseModel


class ChatThread(BaseModel):
    ROLE_CHOICES = [
        ('RIDER', 'Rider'), ('USER', 'User'), ('MERCHANT', 'Merchant'),
    ]
    admin = models.ForeignKey(
        'accounts.AdminProfile', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='chat_threads',
    )
    participant_id = models.UUIDField(db_index=True)
    participant_role = models.CharField(max_length=15, choices=ROLE_CHOICES)
    is_archived = models.BooleanField(default=False)
    unread_count_admin = models.IntegerField(default=0)
    unread_count_participant = models.IntegerField(default=0)
    last_message_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'chat_threads'
        ordering = ['-last_message_at']

    def __str__(self):
        return f"Thread {self.id} — {self.participant_role}:{self.participant_id}"


class ChatMessage(BaseModel):
    SENDER_ROLE_CHOICES = [
        ('ADMIN', 'Admin'), ('RIDER', 'Rider'),
        ('USER', 'User'), ('MERCHANT', 'Merchant'),
    ]
    MESSAGE_TYPE_CHOICES = [
        ('TEXT', 'Text'), ('IMAGE', 'Image'),
        ('FILE', 'File'), ('SYSTEM', 'System'),
    ]
    thread = models.ForeignKey(
        ChatThread, on_delete=models.CASCADE, related_name='messages',
    )
    sender_id = models.UUIDField()
    sender_role = models.CharField(max_length=15, choices=SENDER_ROLE_CHOICES)
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPE_CHOICES, default='TEXT')
    body = models.TextField(null=True, blank=True)
    attachment_url = models.CharField(max_length=500, null=True, blank=True)
    is_verified = models.BooleanField(default=False, help_text='GCash screenshot verified')
    wallet_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'chat_messages'
        ordering = ['created_at']

    def __str__(self):
        return f"Msg {self.id} in thread {self.thread_id}"

