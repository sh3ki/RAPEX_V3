"""RAPEX Merchant Module — Serializers"""
from rest_framework import serializers
from .models import (
    MerchantStore,
    StoreSchedule,
    MerchantMarkupOverride,
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

    class Meta:
        model = MerchantStore
        fields = [
            'id', 'store_type', 'display_name', 'description',
            'logo_url', 'banner_url', 'is_open', 'is_visible',
            'is_accepting_delivery', 'is_accepting_pickup', 'tags',
            'schedules', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'is_open', 'created_at', 'updated_at']


class MerchantStoreCreateSerializer(serializers.Serializer):
    store_type = serializers.ChoiceField(choices=MerchantStore.StoreType.choices)
    display_name = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True)
    logo_url = serializers.CharField(max_length=500, required=False, allow_blank=True)
    banner_url = serializers.CharField(max_length=500, required=False, allow_blank=True)
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


class MerchantOnboardingProfileStepSerializer(serializers.Serializer):
    profile_image_url = serializers.CharField(max_length=500, required=False, allow_blank=True)
    first_name = serializers.CharField(max_length=150)
    middle_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    username = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=20)


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


class MerchantOnboardingDocumentUploadSerializer(serializers.Serializer):
    document_type = serializers.ChoiceField(choices=MerchantDocument.DocumentType.choices)
    file = serializers.FileField()

    def validate_file(self, value):
        max_size = 5 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError('File exceeds 5MB size limit.')

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
        if document_type == MerchantDocument.DocumentType.SELFIE_WITH_ID and content_type == 'application/pdf':
            raise serializers.ValidationError({'file': 'SELFIE_WITH_ID must be an image file.'})
        return attrs


class MerchantOnboardingDocumentsStepSerializer(serializers.Serializer):
    documents = MerchantOnboardingDocumentItemSerializer(many=True)


class MerchantOnboardingVerificationStepSerializer(serializers.Serializer):
    email_otp = serializers.CharField(max_length=6)
    phone_otp = serializers.CharField(max_length=6)
    terms_accepted = serializers.BooleanField()
    privacy_accepted = serializers.BooleanField()


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
