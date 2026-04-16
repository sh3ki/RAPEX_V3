"""
RAPEX Accounts — Models
CustomUser + 5 Role-Specific Profiles + OTP
"""
import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone

from apps.core.constants import KYCStatuses, Roles, VehicleTypes
from apps.core.models import BaseModel


# ═══════════════════════════════════════════════════════════════════
# USER MANAGER
# ═══════════════════════════════════════════════════════════════════
class CustomUserManager(BaseUserManager):
    """Custom manager for CustomUser — phone is the unique identifier."""

    def create_user(self, phone=None, password=None, **extra_fields):
        email = extra_fields.get('email')
        if not phone and not email:
            raise ValueError('Either phone number or email is required.')

        user = self.model(phone=phone, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', Roles.SUPERADMIN)
        extra_fields.setdefault('is_verified', True)
        return self.create_user(phone, password, **extra_fields)


# ═══════════════════════════════════════════════════════════════════
# CUSTOM USER
# ═══════════════════════════════════════════════════════════════════
class CustomUser(AbstractBaseUser, PermissionsMixin):
    """
    Base user model for all RAPEX platform roles.
    Authentication via phone number.
    """
    class AccountStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=20, unique=True, db_index=True, null=True, blank=True)
    email = models.EmailField(max_length=255, unique=True, null=True, blank=True)
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=150, blank=True, default='')
    last_name = models.CharField(max_length=150, blank=True, default='')
    avatar_url = models.URLField(max_length=500, blank=True, default='')
    profile_image_url = models.URLField(max_length=500, blank=True, default='')
    google_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    role = models.CharField(max_length=20, choices=Roles.CHOICES, db_index=True)
    status = models.CharField(
        max_length=20,
        choices=AccountStatus.choices,
        default=AccountStatus.APPROVED,
        db_index=True,
    )
    wizard_completed = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    device_id = models.CharField(max_length=255, null=True, blank=True)
    last_login = models.DateTimeField(null=True, blank=True)
    date_joined = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        indexes = [
            models.Index(fields=['role', 'is_active']),
            models.Index(fields=['status', 'role']),
        ]

    def __str__(self):
        return f"{self.phone or self.email or self.id} ({self.role})"


# ═══════════════════════════════════════════════════════════════════
# ROLE-SPECIFIC PROFILES
# ═══════════════════════════════════════════════════════════════════
class SuperAdminProfile(BaseModel):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='superadminprofile')
    full_name = models.CharField(max_length=200)

    class Meta:
        verbose_name = 'SuperAdmin Profile'

    def __str__(self):
        return f"SuperAdmin: {self.full_name}"


class AdminProfile(BaseModel):
    class SubRole(models.TextChoices):
        OPERATIONS = 'OPERATIONS', 'Operations Manager'
        SUPPORT = 'SUPPORT', 'Support Agent'
        FINANCE = 'FINANCE', 'Finance Officer'
        COMPLIANCE = 'COMPLIANCE', 'Compliance Officer'
        LOGISTICS = 'LOGISTICS', 'Logistics Manager'

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='adminprofile')
    full_name = models.CharField(max_length=200)
    sub_role = models.CharField(max_length=20, choices=SubRole.choices, default=SubRole.OPERATIONS)
    permissions = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = 'Admin Profile'

    def __str__(self):
        return f"Admin: {self.full_name} ({self.sub_role})"


class MerchantProfile(BaseModel):
    class AccountStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='merchantprofile')
    full_name = models.CharField(max_length=200)
    birthday = models.DateField(null=True, blank=True)
    home_address = models.TextField(blank=True, default='')
    business_name = models.CharField(max_length=200, blank=True, default='')
    business_address = models.TextField(blank=True, default='')
    business_lat = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    business_lng = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    kyc_status = models.CharField(max_length=20, choices=KYCStatuses.CHOICES, default=KYCStatuses.PENDING)
    kyc_rejection_reason = models.TextField(null=True, blank=True)
    kyc_id_photo = models.CharField(max_length=500, blank=True, default='')
    kyc_selfie_photo = models.CharField(max_length=500, blank=True, default='')
    kyc_business_doc = models.CharField(max_length=500, blank=True, default='')
    status = models.CharField(max_length=20, choices=AccountStatus.choices, default=AccountStatus.PENDING)
    wizard_completed = models.BooleanField(default=False)
    onboarding_submitted_at = models.DateTimeField(null=True, blank=True)
    resubmission_requested = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Merchant Profile'

    def __str__(self):
        return f"Merchant: {self.full_name} ({self.business_name})"


class RiderProfile(BaseModel):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='riderprofile')
    full_name = models.CharField(max_length=200)
    birthday = models.DateField(null=True, blank=True)
    home_address = models.TextField(blank=True, default='')
    home_lat = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    home_lng = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    emergency_contact_name = models.CharField(max_length=200, blank=True, default='')
    emergency_contact_phone = models.CharField(max_length=20, blank=True, default='')
    vehicle_type = models.CharField(max_length=20, choices=VehicleTypes.CHOICES, default=VehicleTypes.MOTORCYCLE)
    vehicle_plate = models.CharField(max_length=20, null=True, blank=True)
    vehicle_model = models.CharField(max_length=100, null=True, blank=True)
    kyc_status = models.CharField(max_length=20, choices=KYCStatuses.CHOICES, default=KYCStatuses.PENDING)
    kyc_rejection_reason = models.TextField(null=True, blank=True)
    kyc_id_photo = models.CharField(max_length=500, blank=True, default='')
    kyc_selfie_photo = models.CharField(max_length=500, blank=True, default='')
    is_online = models.BooleanField(default=False, db_index=True)
    current_lat = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    current_lng = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    background_check_flagged = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Rider Profile'

    def __str__(self):
        return f"Rider: {self.full_name} ({self.vehicle_type})"


class UserProfile(BaseModel):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='userprofile')
    full_name = models.CharField(max_length=200)
    birthday = models.DateField(null=True, blank=True)
    home_address = models.TextField(blank=True, default='')
    home_lat = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    home_lng = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    kyc_status = models.CharField(max_length=20, choices=KYCStatuses.CHOICES, default=KYCStatuses.PENDING)
    kyc_id_type = models.CharField(max_length=50, blank=True, default='')
    kyc_id_photo = models.CharField(max_length=500, blank=True, default='')
    kyc_selfie_photo = models.CharField(max_length=500, blank=True, default='')

    class Meta:
        verbose_name = 'User Profile'

    def __str__(self):
        return f"User: {self.full_name}"


class SocialAccount(BaseModel):
    class Provider(models.TextChoices):
        GOOGLE = 'GOOGLE', 'Google'

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='social_accounts')
    provider = models.CharField(max_length=20, choices=Provider.choices)
    provider_user_id = models.CharField(max_length=255, db_index=True)
    email = models.EmailField(max_length=255)
    email_verified = models.BooleanField(default=False)
    picture_url = models.URLField(max_length=500, blank=True, default='')
    extra_data = models.JSONField(default=dict, blank=True)
    last_login_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['provider', 'provider_user_id'], name='unique_social_provider_user'),
            models.UniqueConstraint(fields=['user', 'provider'], name='unique_user_provider'),
        ]

    def __str__(self):
        return f"{self.provider}:{self.email}"


# ═══════════════════════════════════════════════════════════════════
# OTP MODEL
# ═══════════════════════════════════════════════════════════════════
class OTPRecord(BaseModel):
    class Purpose(models.TextChoices):
        REGISTRATION = 'REGISTRATION', 'Registration'
        LOGIN = 'LOGIN', 'Login'
        RESET = 'RESET', 'Password Reset'
        MAGIC_LINK = 'MAGIC_LINK', 'Magic Link Login'
        EMAIL_VERIFICATION = 'EMAIL_VERIFICATION', 'Email Verification'
        PHONE_VERIFICATION = 'PHONE_VERIFICATION', 'Phone Verification'

    class Channel(models.TextChoices):
        SMS = 'SMS', 'SMS'
        EMAIL = 'EMAIL', 'Email'

    phone = models.CharField(max_length=20, db_index=True, null=True, blank=True)
    email = models.EmailField(max_length=255, null=True, blank=True, db_index=True)
    channel = models.CharField(max_length=10, choices=Channel.choices, default=Channel.SMS)
    otp_code = models.CharField(max_length=6)
    token_hash = models.CharField(max_length=64, null=True, blank=True, db_index=True)
    purpose = models.CharField(max_length=20, choices=Purpose.choices)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    attempt_count = models.IntegerField(default=0)
    meta = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['phone', 'purpose', 'is_used']),
            models.Index(fields=['email', 'purpose', 'channel', 'is_used']),
        ]

    def __str__(self):
        return f"OTP for {self.phone} ({self.purpose})"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at
