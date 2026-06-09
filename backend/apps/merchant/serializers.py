"""RAPEX Merchant Module — Serializers"""
from collections import defaultdict

from rest_framework import serializers
from apps.core.storage import normalize_storage_path, resolve_storage_url
from .models import (
    MerchantStore,
    StoreSchedule,
    MerchantMarkupOverride,
    MerchantCountryCode,
    MerchantBusinessCategory,
    MerchantBusinessType,
    MerchantBusinessProfile,
    MerchantLocation,
    MerchantDocument,
    MerchantOnboardingState,
)


class StoreScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreSchedule
        fields = ['id', 'day_of_week', 'open_time', 'close_time', 'is_closed']
        read_only_fields = ['id']


class MerchantStoreSerializer(serializers.ModelSerializer):
    schedules = StoreScheduleSerializer(many=True, read_only=True)
    merchant_profile = serializers.SerializerMethodField()
    business_profile = serializers.SerializerMethodField()

    class Meta:
        model = MerchantStore
        fields = [
            'id', 'store_type', 'display_name', 'description',
            'logo_url', 'banner_url', 'is_open', 'is_visible',
            'is_accepting_delivery', 'is_accepting_pickup', 'tags',
            'merchant_profile', 'business_profile',
            'schedules', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'is_open', 'created_at', 'updated_at']

    def get_merchant_profile(self, instance):
        user = instance.merchant.user
        return {
            'full_name': instance.merchant.full_name,
            'username': user.username,
            'email': user.email,
            'phone': user.phone,
        }

    def get_business_profile(self, instance):
        try:
            business_profile = instance.merchant.business_profile
        except MerchantBusinessProfile.DoesNotExist:
            return None

        return {
            'registration_type': business_profile.registration_type,
            'registration_type_label': business_profile.get_registration_type_display(),
            'categories': list(
                business_profile.categories.filter(is_deleted=False, is_active=True).values_list('name', flat=True)
            ),
            'business_types': list(
                business_profile.business_types.filter(is_deleted=False, is_active=True).values_list('name', flat=True)
            ),
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        data['logo_url'] = resolve_storage_url(data.get('logo_url'), request=request)
        data['banner_url'] = resolve_storage_url(data.get('banner_url'), request=request)
        return data


class MerchantStoreCreateSerializer(serializers.Serializer):
    store_type = serializers.ChoiceField(choices=MerchantStore.StoreType.choices)
    display_name = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True)
    profile_image = serializers.ImageField(write_only=True, required=True)
    is_accepting_delivery = serializers.BooleanField(default=True)
    is_accepting_pickup = serializers.BooleanField(default=True)
    tags = serializers.ListField(child=serializers.CharField(), required=False, default=list)


class NearbyStoreSerializer(serializers.ModelSerializer):
    distance_km = serializers.FloatField(read_only=True)
    merchant_name = serializers.CharField(source='merchant.full_name', read_only=True)
    business_lat = serializers.DecimalField(
        source='merchant.business_lat', max_digits=10, decimal_places=8, read_only=True,
    )
    business_lng = serializers.DecimalField(
        source='merchant.business_lng', max_digits=11, decimal_places=8, read_only=True,
    )

    class Meta:
        model = MerchantStore
        fields = [
            'id', 'store_type', 'display_name', 'description',
            'logo_url', 'banner_url', 'is_open',
            'is_accepting_delivery', 'is_accepting_pickup', 'tags',
            'merchant_name', 'business_lat', 'business_lng', 'distance_km',
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        data['logo_url'] = resolve_storage_url(data.get('logo_url'), request=request)
        data['banner_url'] = resolve_storage_url(data.get('banner_url'), request=request)
        return data


class MerchantMarkupOverrideSerializer(serializers.ModelSerializer):
    class Meta:
        model = MerchantMarkupOverride
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class MerchantBusinessCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MerchantBusinessCategory
        fields = ['id', 'name']


class MerchantBusinessTypeSerializer(serializers.ModelSerializer):
    category_id = serializers.UUIDField(source='category.id', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = MerchantBusinessType
        fields = ['id', 'name', 'category_id', 'category_name']


class MerchantCountryCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MerchantCountryCode
        fields = ['id', 'country_name', 'country_code', 'country_flag_emoji', 'max_digits', 'is_default']


class MerchantOnboardingProfileStepSerializer(serializers.Serializer):
    profile_image_url = serializers.CharField(max_length=500, required=False, allow_blank=True)
    first_name = serializers.CharField(max_length=150)
    middle_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    username = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True, min_length=8, required=False, allow_blank=True, default='')
    confirm_password = serializers.CharField(write_only=True, min_length=8, required=False, allow_blank=True, default='')

    def validate_profile_image_url(self, value):
        return normalize_storage_path(value)


class MerchantOnboardingBusinessStepSerializer(serializers.Serializer):
    business_name = serializers.CharField(max_length=200)
    category_ids = serializers.ListField(child=serializers.UUIDField(), allow_empty=False)
    business_type_ids = serializers.ListField(child=serializers.UUIDField(), allow_empty=False)
    registration_type = serializers.ChoiceField(choices=MerchantBusinessProfile.RegistrationType.choices)


class MerchantOnboardingLocationStepSerializer(serializers.Serializer):
    house_number = serializers.CharField(max_length=50)
    street_name = serializers.CharField(max_length=200)
    barangay = serializers.CharField(max_length=120)
    city_municipality = serializers.CharField(max_length=120)
    province = serializers.CharField(max_length=120)
    zip_code = serializers.CharField(max_length=12)
    latitude = serializers.DecimalField(max_digits=10, decimal_places=8)
    longitude = serializers.DecimalField(max_digits=11, decimal_places=8)


class MerchantOnboardingDocumentItemSerializer(serializers.Serializer):
    document_type = serializers.ChoiceField(choices=MerchantDocument.DocumentType.choices)
    file_url = serializers.CharField(max_length=500)
    is_optional = serializers.BooleanField(default=False)

    def validate_file_url(self, value):
        return normalize_storage_path(value)


class MerchantOnboardingDocumentUploadSerializer(serializers.Serializer):
    document_type = serializers.ChoiceField(choices=MerchantDocument.DocumentType.choices)
    file = serializers.FileField()

    def validate_file(self, value):
        max_size = 10 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError('File exceeds 10MB size limit.')

        allowed_content_types = {
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/pdf',
        }
        content_type = getattr(value, 'content_type', None)
        if content_type and content_type not in allowed_content_types:
            raise serializers.ValidationError('Unsupported file type. Allowed types: JPEG, PNG, WEBP, PDF.')
        return value

    def validate(self, attrs):
        document_type = attrs['document_type']
        content_type = getattr(attrs['file'], 'content_type', None)
        image_only_types = {
            MerchantDocument.DocumentType.SELFIE_WITH_ID,
            MerchantDocument.DocumentType.VALID_ID_FRONT,
            MerchantDocument.DocumentType.VALID_ID_BACK,
        }

        if document_type in image_only_types and (not content_type or not content_type.startswith('image/')):
            raise serializers.ValidationError({'file': f'{document_type} must be an image file.'})
        return attrs


class MerchantOnboardingProfileImageUploadSerializer(serializers.Serializer):
    file = serializers.ImageField()

    def validate_file(self, value):
        max_size = 5 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError('File exceeds 5MB size limit.')
        return value


class MerchantStoreAssetUploadSerializer(serializers.Serializer):
    asset_type = serializers.ChoiceField(choices=['logo', 'banner'])
    file = serializers.ImageField()

    def validate_file(self, value):
        max_size = 5 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError('File exceeds 5MB size limit.')
        return value


class MerchantProductImageUploadSerializer(serializers.Serializer):
    file = serializers.ImageField()

    def validate_file(self, value):
        max_size = 10 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError('File exceeds 10MB size limit.')
        return value


class MerchantOnboardingDocumentsStepSerializer(serializers.Serializer):
    documents = MerchantOnboardingDocumentItemSerializer(many=True)

    REQUIRED_BY_REGISTRATION = {
        MerchantBusinessProfile.RegistrationType.UNREGISTERED: {
            MerchantDocument.DocumentType.SELFIE_WITH_ID,
            MerchantDocument.DocumentType.VALID_ID_FRONT,
            MerchantDocument.DocumentType.VALID_ID_BACK,
        },
        MerchantBusinessProfile.RegistrationType.REGISTERED_NON_VAT: {
            MerchantDocument.DocumentType.SELFIE_WITH_ID,
            MerchantDocument.DocumentType.VALID_ID_FRONT,
            MerchantDocument.DocumentType.VALID_ID_BACK,
            MerchantDocument.DocumentType.BARANGAY_PERMIT,
            MerchantDocument.DocumentType.DTI_OR_SEC,
        },
        MerchantBusinessProfile.RegistrationType.REGISTERED_VAT: {
            MerchantDocument.DocumentType.SELFIE_WITH_ID,
            MerchantDocument.DocumentType.VALID_ID_FRONT,
            MerchantDocument.DocumentType.VALID_ID_BACK,
            MerchantDocument.DocumentType.BIR_2303,
            MerchantDocument.DocumentType.DTI_OR_SEC,
            MerchantDocument.DocumentType.MAYORS_PERMIT,
        },
    }

    ALLOWED_BY_REGISTRATION = {
        MerchantBusinessProfile.RegistrationType.UNREGISTERED: {
            MerchantDocument.DocumentType.SELFIE_WITH_ID,
            MerchantDocument.DocumentType.VALID_ID_FRONT,
            MerchantDocument.DocumentType.VALID_ID_BACK,
            MerchantDocument.DocumentType.OTHER,
        },
        MerchantBusinessProfile.RegistrationType.REGISTERED_NON_VAT: {
            MerchantDocument.DocumentType.SELFIE_WITH_ID,
            MerchantDocument.DocumentType.VALID_ID_FRONT,
            MerchantDocument.DocumentType.VALID_ID_BACK,
            MerchantDocument.DocumentType.BARANGAY_PERMIT,
            MerchantDocument.DocumentType.DTI_OR_SEC,
            MerchantDocument.DocumentType.BIR_2303,
            MerchantDocument.DocumentType.MAYORS_PERMIT,
            MerchantDocument.DocumentType.OTHER,
        },
        MerchantBusinessProfile.RegistrationType.REGISTERED_VAT: {
            MerchantDocument.DocumentType.SELFIE_WITH_ID,
            MerchantDocument.DocumentType.VALID_ID_FRONT,
            MerchantDocument.DocumentType.VALID_ID_BACK,
            MerchantDocument.DocumentType.BIR_2303,
            MerchantDocument.DocumentType.DTI_OR_SEC,
            MerchantDocument.DocumentType.MAYORS_PERMIT,
            MerchantDocument.DocumentType.OTHER,
        },
    }

    def validate(self, attrs):
        documents = attrs.get('documents', [])
        merchant_profile = self.context.get('merchant_profile')
        business_profile = MerchantBusinessProfile.objects.filter(merchant=merchant_profile).first() if merchant_profile else None
        registration_type = (
            business_profile.registration_type
            if business_profile
            else MerchantBusinessProfile.RegistrationType.UNREGISTERED
        )

        allowed_types = self.ALLOWED_BY_REGISTRATION[registration_type]
        required_types = self.REQUIRED_BY_REGISTRATION[registration_type]

        counts = defaultdict(int)
        for item in documents:
            doc_type = item['document_type']
            if doc_type not in allowed_types:
                raise serializers.ValidationError(
                    {
                        'documents': (
                            f'{doc_type} is not allowed for registration type {registration_type}.'
                        )
                    }
                )
            counts[doc_type] += 1

        for required_type in required_types:
            if counts.get(required_type, 0) == 0:
                raise serializers.ValidationError(
                    {'documents': f'Required document missing: {required_type}'}
                )

        single_file_types = {
            MerchantDocument.DocumentType.SELFIE_WITH_ID,
            MerchantDocument.DocumentType.VALID_ID_FRONT,
            MerchantDocument.DocumentType.VALID_ID_BACK,
            MerchantDocument.DocumentType.BARANGAY_PERMIT,
            MerchantDocument.DocumentType.DTI_OR_SEC,
            MerchantDocument.DocumentType.BIR_2303,
            MerchantDocument.DocumentType.MAYORS_PERMIT,
        }

        for doc_type, count in counts.items():
            if doc_type in single_file_types and count > 1:
                raise serializers.ValidationError(
                    {'documents': f'{doc_type} accepts one file only.'}
                )

            if doc_type == MerchantDocument.DocumentType.OTHER and count > 3:
                raise serializers.ValidationError(
                    {'documents': 'OTHER accepts up to 3 files only.'}
                )

        return attrs


class MerchantOnboardingVerificationStepSerializer(serializers.Serializer):
    email_otp = serializers.CharField(max_length=6, min_length=6, required=False, allow_blank=True, trim_whitespace=True, default='')
    phone_otp = serializers.CharField(max_length=6, min_length=6, required=False, allow_blank=True, trim_whitespace=True, default='')
    terms_accepted = serializers.BooleanField()
    privacy_accepted = serializers.BooleanField()


class MerchantOnboardingSendOtpSerializer(serializers.Serializer):
    CHANNEL_EMAIL = 'EMAIL'
    CHANNEL_PHONE = 'PHONE'
    CHANNEL_BOTH = 'BOTH'

    channel = serializers.ChoiceField(
        choices=[
            (CHANNEL_EMAIL, 'Email OTP'),
            (CHANNEL_PHONE, 'Phone OTP'),
            (CHANNEL_BOTH, 'Both Email and Phone OTP'),
        ],
        required=False,
        default=CHANNEL_BOTH,
    )


class MerchantOnboardingVerifyOtpSerializer(serializers.Serializer):
    CHANNEL_EMAIL = 'EMAIL'
    CHANNEL_PHONE = 'PHONE'

    channel = serializers.ChoiceField(
        choices=[
            (CHANNEL_EMAIL, 'Email OTP'),
            (CHANNEL_PHONE, 'Phone OTP'),
        ]
    )
    otp_code = serializers.CharField(max_length=6, min_length=6, trim_whitespace=True)


class MerchantLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = MerchantLocation
        fields = [
            'house_number', 'street_name', 'barangay', 'city_municipality',
            'province', 'zip_code', 'latitude', 'longitude',
        ]


class MerchantBusinessProfileSerializer(serializers.ModelSerializer):
    categories = MerchantBusinessCategorySerializer(many=True, read_only=True)
    business_types = MerchantBusinessTypeSerializer(many=True, read_only=True)

    class Meta:
        model = MerchantBusinessProfile
        fields = ['business_name', 'registration_type', 'categories', 'business_types']


class MerchantDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MerchantDocument
        fields = ['id', 'document_type', 'file_url', 'is_optional', 'is_verified', 'rejection_reason']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        data['file_url'] = resolve_storage_url(data.get('file_url'), request=request)
        return data


class MerchantOnboardingStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MerchantOnboardingState
        fields = [
            'current_step',
            'is_submitted',
            'email_verified',
            'phone_verified',
            'terms_accepted',
            'privacy_accepted',
            'submitted_at',
            'can_resubmit',
            'admin_resubmission_note',
            'draft_payload',
        ]
