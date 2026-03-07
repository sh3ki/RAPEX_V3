"""RAPEX Fraud Module — Models"""
import uuid
from django.db import models
from apps.core.models import BaseModel


class FraudFlag(BaseModel):
    SUBJECT_ROLE_CHOICES = [
        ('USER', 'User'), ('MERCHANT', 'Merchant'), ('RIDER', 'Rider'),
        ('ORDER', 'Order'), ('TRANSACTION', 'Transaction'),
    ]
    FLAG_TYPE_CHOICES = [
        ('KYC_ANOMALY', 'KYC Anomaly'),
        ('CANCEL_PATTERN', 'Cancel Pattern'),
        ('SUSPICIOUS_TRANSACTION', 'Suspicious Transaction'),
        ('RAPID_REFERRAL', 'Rapid Referral'),
        ('NON_RESPONSIVE_RIDER', 'Non-Responsive Rider'),
        ('LATE_REMITTANCE', 'Late Remittance'),
        ('GPS_MANIPULATION', 'GPS Manipulation'),
        ('OTHER', 'Other'),
    ]
    RESOLUTION_CHOICES = [
        ('PENDING', 'Pending'), ('CLEARED', 'Cleared'),
        ('ESCALATED', 'Escalated'), ('BLACKLISTED', 'Blacklisted'),
    ]

    subject_id = models.UUIDField(db_index=True)
    subject_role = models.CharField(max_length=15, choices=SUBJECT_ROLE_CHOICES)
    flag_type = models.CharField(max_length=30, choices=FLAG_TYPE_CHOICES)
    flag_reason = models.TextField()
    auto_flagged = models.BooleanField(default=True)
    is_reviewed = models.BooleanField(default=False)
    reviewed_by = models.ForeignKey(
        'accounts.AdminProfile', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='reviewed_flags',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    resolution = models.CharField(max_length=15, choices=RESOLUTION_CHOICES, default='PENDING')

    class Meta:
        db_table = 'fraud_flags'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.flag_type}: {self.subject_role} {self.subject_id}"


class InvestigationCase(BaseModel):
    PRIORITY_CHOICES = [
        ('LOW', 'Low'), ('MEDIUM', 'Medium'),
        ('HIGH', 'High'), ('CRITICAL', 'Critical'),
    ]
    STATUS_CHOICES = [
        ('OPEN', 'Open'), ('UNDER_REVIEW', 'Under Review'),
        ('RESOLVED', 'Resolved'), ('ESCALATED', 'Escalated'),
    ]

    case_number = models.CharField(max_length=20, unique=True)
    fraud_flag = models.ForeignKey(
        FraudFlag, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='cases',
    )
    subject_id = models.UUIDField()
    subject_role = models.CharField(
        max_length=15, choices=FraudFlag.SUBJECT_ROLE_CHOICES,
    )
    title = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='OPEN')
    assigned_to = models.ForeignKey(
        'accounts.AdminProfile', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_cases',
    )
    opened_by = models.ForeignKey(
        'accounts.AdminProfile', on_delete=models.CASCADE,
        related_name='opened_cases',
    )
    resolution_notes = models.TextField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'investigation_cases'
        ordering = ['-created_at']

    def __str__(self):
        return f"Case {self.case_number}"

    def save(self, *args, **kwargs):
        if not self.case_number:
            import random, string
            self.case_number = 'CASE-' + ''.join(random.choices(string.digits, k=8))
        super().save(*args, **kwargs)


class AccountBlacklist(BaseModel):
    ROLE_CHOICES = [
        ('USER', 'User'), ('MERCHANT', 'Merchant'), ('RIDER', 'Rider'),
    ]
    subject_id = models.UUIDField(db_index=True)
    subject_role = models.CharField(max_length=15, choices=ROLE_CHOICES)
    reason = models.TextField()
    blacklisted_by = models.ForeignKey(
        'accounts.AdminProfile', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='blacklist_entries',
    )
    is_permanent = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'account_blacklist'

    def __str__(self):
        return f"Blacklisted {self.subject_role}: {self.subject_id}"

