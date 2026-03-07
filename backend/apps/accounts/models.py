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

    def create_user(self, phone, password=None, **extra_fields):
        if not phone:
            raise ValueError('Phone number is required.')
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
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=20, unique=True, db_index=True)
    email = models.EmailField(max_length=255, unique=True, null=True, blank=True)
    role = models.CharField(max_length=20, choices=Roles.CHOICES, db_index=True)
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
        ]

    def __str__(self):
        return f"{self.phone} ({self.role})"


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


# ═══════════════════════════════════════════════════════════════════
# OTP MODEL
# ═══════════════════════════════════════════════════════════════════
class OTPRecord(BaseModel):
    class Purpose(models.TextChoices):
        REGISTRATION = 'REGISTRATION', 'Registration'
        LOGIN = 'LOGIN', 'Login'
        RESET = 'RESET', 'Password Reset'

    phone = models.CharField(max_length=20, db_index=True)
    otp_code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=Purpose.choices)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    attempt_count = models.IntegerField(default=0)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['phone', 'purpose', 'is_used']),
        ]

    def __str__(self):
        return f"OTP for {self.phone} ({self.purpose})"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at
