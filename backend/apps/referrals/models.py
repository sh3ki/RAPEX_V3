"""RAPEX Referrals Module — Models"""
from django.db import models
from apps.core.models import BaseModel


class ReferralCode(BaseModel):
    ROLE_CHOICES = [('USER', 'User'), ('RIDER', 'Rider')]
    owner_id = models.UUIDField(db_index=True)
    owner_role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    code = models.CharField(max_length=20, unique=True)
    qr_code_url = models.CharField(max_length=500, null=True, blank=True)
    total_used = models.IntegerField(default=0)

    class Meta:
        db_table = 'referral_codes'

    def __str__(self):
        return f"{self.code} ({self.owner_role})"


class ReferralRecord(BaseModel):
    STATUS_CHOICES = [
        ('INVITED', 'Invited'), ('REGISTERED', 'Registered'),
        ('QUALIFIED', 'Qualified'), ('CREDITED', 'Credited'),
        ('CAP_REACHED', 'Cap Reached'),
    ]
    referral_code = models.ForeignKey(
        ReferralCode, on_delete=models.CASCADE, related_name='records',
    )
    referred_id = models.UUIDField()
    referred_role = models.CharField(max_length=10, choices=[('USER', 'User'), ('RIDER', 'Rider')])
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='INVITED')
    points_credited = models.IntegerField(default=0)
    credited_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'referral_records'

    def __str__(self):
        return f"Ref {self.referral_code.code} → {self.referred_id}"


class ReferralMonthlyTracker(models.Model):
    import uuid
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner_id = models.UUIDField()
    owner_role = models.CharField(max_length=10, choices=[('USER', 'User'), ('RIDER', 'Rider')])
    month_year = models.CharField(max_length=7, help_text='YYYY-MM')
    points_credited = models.IntegerField(default=0)

    class Meta:
        db_table = 'referral_monthly_trackers'
        unique_together = ['owner_id', 'owner_role', 'month_year']

    def __str__(self):
        return f"{self.owner_id} {self.month_year}: {self.points_credited}pts"

