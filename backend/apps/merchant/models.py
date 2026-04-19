"""RAPEX Merchant Module — Models"""
from django.db import models
from apps.core.models import BaseModel


class MerchantStore(BaseModel):
    class StoreType(models.TextChoices):
        SHOP = 'SHOP', 'Shop'
        FRESH_MARKET = 'FRESH_MARKET', 'Fresh Market'
        READY_TO_EAT = 'READY_TO_EAT', 'Ready to Eat'
        PRELOVED = 'PRELOVED', 'Pre-Loved'

    merchant = models.ForeignKey(
        'accounts.MerchantProfile', on_delete=models.CASCADE, related_name='stores'
    )
    store_type = models.CharField(max_length=20, choices=StoreType.choices)
    display_name = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    logo_url = models.CharField(max_length=500, null=True, blank=True)
    banner_url = models.CharField(max_length=500, null=True, blank=True)
    is_open = models.BooleanField(default=False)
    is_visible = models.BooleanField(default=True)
    is_accepting_delivery = models.BooleanField(default=True)
    is_accepting_pickup = models.BooleanField(default=True)
    tags = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = 'merchant_stores'
        unique_together = ['merchant', 'store_type']

    def __str__(self):
        return f"{self.display_name} ({self.store_type})"


class StoreSchedule(models.Model):
    id = models.UUIDField(primary_key=True, default=None, editable=False)
    store = models.ForeignKey(MerchantStore, on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.SmallIntegerField(help_text='0=Monday, 6=Sunday')
    open_time = models.TimeField(null=True, blank=True)
    close_time = models.TimeField(null=True, blank=True)
    is_closed = models.BooleanField(default=False)

    class Meta:
        db_table = 'store_schedules'
        unique_together = ['store', 'day_of_week']

    def save(self, *args, **kwargs):
        if not self.id:
            import uuid
            self.id = uuid.uuid4()
        super().save(*args, **kwargs)

    def __str__(self):
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        return f"{self.store.display_name} - {days[self.day_of_week]}"


class MerchantMarkupOverride(BaseModel):
    merchant = models.ForeignKey(
        'accounts.MerchantProfile', on_delete=models.CASCADE, related_name='markup_overrides'
    )
    store_type = models.CharField(
        max_length=20, choices=MerchantStore.StoreType.choices, null=True, blank=True,
        help_text='NULL = applies to all stores',
    )
    tier_1_rate = models.DecimalField(max_digits=5, decimal_places=2, help_text='₱1-₱100')
    tier_2_rate = models.DecimalField(max_digits=5, decimal_places=2, help_text='₱101-₱1000')
    tier_3_rate = models.DecimalField(max_digits=5, decimal_places=2, help_text='₱1001+')
    set_by_admin = models.ForeignKey(
        'accounts.AdminProfile', on_delete=models.SET_NULL, null=True, related_name='+'
    )
    reason = models.TextField()

    class Meta:
        db_table = 'merchant_markup_overrides'

    def __str__(self):
        return f"Override for {self.merchant} ({self.store_type or 'ALL'})"


class MerchantCountryCode(BaseModel):
    country_name = models.CharField(max_length=120, unique=True)
    country_code = models.CharField(max_length=8)
    country_flag_emoji = models.CharField(max_length=8, blank=True, default='')
    max_digits = models.PositiveSmallIntegerField(default=10)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'merchant_country_codes'
        ordering = ['-is_default', 'country_name']

    def __str__(self):
        return f"{self.country_name} ({self.country_code})"


class MerchantBusinessCategory(BaseModel):
    name = models.CharField(max_length=120, unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'merchant_business_categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class MerchantBusinessType(BaseModel):
    category = models.ForeignKey(
        MerchantBusinessCategory,
        on_delete=models.CASCADE,
        related_name='types',
    )
    name = models.CharField(max_length=120)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'merchant_business_types'
        constraints = [
            models.UniqueConstraint(
                fields=['category', 'name'],
                name='uniq_merchant_business_type_per_category',
            ),
        ]
        ordering = ['name']

    def __str__(self):
        return f"{self.category.name} - {self.name}"


class MerchantBusinessProfile(BaseModel):
    class RegistrationType(models.TextChoices):
        UNREGISTERED = 'UNREGISTERED', 'Unregistered'
        REGISTERED_NON_VAT = 'REGISTERED_NON_VAT', 'Registered (NON VAT)'
        REGISTERED_VAT = 'REGISTERED_VAT', 'Registered (VAT Included)'

    merchant = models.OneToOneField(
        'accounts.MerchantProfile',
        on_delete=models.CASCADE,
        related_name='business_profile',
    )
    business_name = models.CharField(max_length=200)
    registration_type = models.CharField(
        max_length=30,
        choices=RegistrationType.choices,
        default=RegistrationType.UNREGISTERED,
    )
    categories = models.ManyToManyField(
        MerchantBusinessCategory,
        related_name='merchant_business_profiles',
        blank=True,
    )
    business_types = models.ManyToManyField(
        MerchantBusinessType,
        related_name='merchant_business_profiles',
        blank=True,
    )

    class Meta:
        db_table = 'merchant_business_profiles'

    def __str__(self):
        return f"Business Profile - {self.merchant_id}"


class MerchantLocation(BaseModel):
    merchant = models.OneToOneField(
        'accounts.MerchantProfile',
        on_delete=models.CASCADE,
        related_name='onboarding_location',
    )
    house_number = models.CharField(max_length=50, blank=True, default='')
    street_name = models.CharField(max_length=200, blank=True, default='')
    barangay = models.CharField(max_length=120, blank=True, default='')
    city_municipality = models.CharField(max_length=120, blank=True, default='')
    province = models.CharField(max_length=120, blank=True, default='')
    zip_code = models.CharField(max_length=12, blank=True, default='')
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)

    class Meta:
        db_table = 'merchant_locations'

    def __str__(self):
        return f"Location - {self.merchant_id}"


class MerchantDocument(BaseModel):
    class DocumentType(models.TextChoices):
        SELFIE_WITH_ID = 'SELFIE_WITH_ID', 'Selfie with ID'
        VALID_ID_FRONT = 'VALID_ID_FRONT', 'Valid ID (Front)'
        VALID_ID_BACK = 'VALID_ID_BACK', 'Valid ID (Back)'
        BARANGAY_PERMIT = 'BARANGAY_PERMIT', 'Barangay Permit'
        DTI_OR_SEC = 'DTI_OR_SEC', 'DTI or SEC Certificate'
        BIR_2303 = 'BIR_2303', 'BIR Certificate of Registration (Form 2303)'
        MAYORS_PERMIT = 'MAYORS_PERMIT', "Mayor's Permit / Business Permit"
        OTHER = 'OTHER', 'Other Document'

    merchant = models.ForeignKey(
        'accounts.MerchantProfile',
        on_delete=models.CASCADE,
        related_name='onboarding_documents',
    )
    document_type = models.CharField(max_length=30, choices=DocumentType.choices)
    file_url = models.CharField(max_length=500)
    is_optional = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    rejection_reason = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'merchant_documents'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.document_type} - {self.merchant_id}"


class MerchantOnboardingState(BaseModel):
    merchant = models.OneToOneField(
        'accounts.MerchantProfile',
        on_delete=models.CASCADE,
        related_name='onboarding_state',
    )
    current_step = models.PositiveSmallIntegerField(default=1)
    is_submitted = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)
    terms_accepted = models.BooleanField(default=False)
    privacy_accepted = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(null=True, blank=True)
    can_resubmit = models.BooleanField(default=False)
    admin_resubmission_note = models.TextField(blank=True, default='')
    draft_payload = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'merchant_onboarding_states'

    def __str__(self):
        return f"Onboarding State - {self.merchant_id}"

