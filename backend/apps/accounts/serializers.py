"""
RAPEX Accounts — Serializers
"""
from rest_framework import serializers
from apps.core.storage import resolve_storage_url

from .models import (
    AdminProfile,
    CustomUser,
    MerchantProfile,
    RiderProfile,
    SuperAdminProfile,
    UserProfile,
)


# ═══════════════════════════════════════════════════════════════════
# OTP SERIALIZERS
# ═══════════════════════════════════════════════════════════════════
class OTPRequestSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)
    purpose = serializers.ChoiceField(choices=['REGISTRATION', 'LOGIN', 'RESET'])


class OTPVerifySerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)
    otp_code = serializers.CharField(max_length=6, min_length=6)
    purpose = serializers.ChoiceField(choices=['REGISTRATION', 'LOGIN', 'RESET'])


# ═══════════════════════════════════════════════════════════════════
# REGISTRATION SERIALIZERS
# ═══════════════════════════════════════════════════════════════════
class UserRegistrationSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)
    password = serializers.CharField(min_length=8, write_only=True)
    full_name = serializers.CharField(max_length=200)
    birthday = serializers.DateField(required=False, allow_null=True)
    home_address = serializers.CharField(required=False, allow_blank=True)


class MerchantRegistrationSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)
    password = serializers.CharField(min_length=8, write_only=True)
    full_name = serializers.CharField(max_length=200)
    birthday = serializers.DateField(required=False, allow_null=True)
    home_address = serializers.CharField(required=False, allow_blank=True)
    business_name = serializers.CharField(max_length=200)
    business_address = serializers.CharField(required=False, allow_blank=True)
    business_lat = serializers.DecimalField(max_digits=10, decimal_places=8, required=False, allow_null=True)
    business_lng = serializers.DecimalField(max_digits=11, decimal_places=8, required=False, allow_null=True)


class RiderRegistrationSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)
    password = serializers.CharField(min_length=8, write_only=True)
    full_name = serializers.CharField(max_length=200)
    birthday = serializers.DateField(required=False, allow_null=True)
    home_address = serializers.CharField(required=False, allow_blank=True)
    emergency_contact_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    emergency_contact_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    vehicle_type = serializers.ChoiceField(choices=['BICYCLE', 'MOTORCYCLE', '4_WHEELS'], default='MOTORCYCLE')
    vehicle_plate = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)
    vehicle_model = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)


# ═══════════════════════════════════════════════════════════════════
# LOGIN SERIALIZERS
# ═══════════════════════════════════════════════════════════════════
class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=False, allow_blank=False)
    email = serializers.EmailField(required=False)
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(
        choices=['SUPERADMIN', 'ADMIN', 'MERCHANT', 'RIDER', 'USER'],
        required=False,
        allow_null=True,
    )

    def validate(self, attrs):
        identifier = attrs.get('identifier') or attrs.get('email')
        if not identifier:
            raise serializers.ValidationError('Either identifier or email is required.')
        attrs['identifier'] = identifier.strip()
        return attrs


class MagicLinkRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=['SUPERADMIN', 'ADMIN', 'MERCHANT', 'RIDER', 'USER'])
    redirect_url = serializers.URLField(required=False, allow_blank=True)


class MagicLinkVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    token = serializers.CharField()
    role = serializers.ChoiceField(
        choices=['SUPERADMIN', 'ADMIN', 'MERCHANT', 'RIDER', 'USER'],
        required=False,
        allow_null=True,
    )


class GoogleLoginSerializer(serializers.Serializer):
    id_token = serializers.CharField()
    role = serializers.ChoiceField(
        choices=['SUPERADMIN', 'ADMIN', 'MERCHANT', 'RIDER', 'USER'],
        required=False,
        allow_null=True,
    )


class GoogleSignupSerializer(serializers.Serializer):
    id_token = serializers.CharField()
    role = serializers.ChoiceField(choices=['SUPERADMIN', 'ADMIN', 'MERCHANT', 'RIDER', 'USER'])
    email = serializers.EmailField(required=False)
    full_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    business_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    admin_sub_role = serializers.ChoiceField(
        choices=['OPERATIONS', 'SUPPORT', 'FINANCE', 'COMPLIANCE', 'LOGISTICS'],
        required=False,
        allow_null=True,
    )


class TokenRefreshSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class UsernameAvailabilitySerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)


# ═══════════════════════════════════════════════════════════════════
# PROFILE SERIALIZERS
# ═══════════════════════════════════════════════════════════════════
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'id', 'phone', 'email', 'first_name', 'last_name', 'avatar_url',
            'role', 'status', 'wizard_completed', 'is_active', 'is_verified', 'date_joined',
        ]
        read_only_fields = fields

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        data['avatar_url'] = resolve_storage_url(data.get('avatar_url'), request=request)
        return data


class SuperAdminProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = SuperAdminProfile
        fields = ['id', 'user', 'full_name', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class AdminProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = AdminProfile
        fields = ['id', 'user', 'full_name', 'sub_role', 'permissions', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class MerchantProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = MerchantProfile
        fields = [
            'id', 'user', 'full_name', 'birthday', 'home_address',
            'business_name', 'business_address', 'business_lat', 'business_lng',
            'kyc_status', 'kyc_rejection_reason',
            'kyc_id_photo', 'kyc_selfie_photo', 'kyc_business_doc',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user', 'kyc_status', 'kyc_rejection_reason', 'created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        data['kyc_id_photo'] = resolve_storage_url(data.get('kyc_id_photo'), request=request)
        data['kyc_selfie_photo'] = resolve_storage_url(data.get('kyc_selfie_photo'), request=request)
        data['kyc_business_doc'] = resolve_storage_url(data.get('kyc_business_doc'), request=request)
        return data


class RiderProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = RiderProfile
        fields = [
            'id', 'user', 'full_name', 'birthday', 'home_address',
            'home_lat', 'home_lng',
            'emergency_contact_name', 'emergency_contact_phone',
            'vehicle_type', 'vehicle_plate', 'vehicle_model',
            'kyc_status', 'kyc_rejection_reason',
            'kyc_id_photo', 'kyc_selfie_photo',
            'is_online', 'current_lat', 'current_lng',
            'background_check_flagged',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'user', 'kyc_status', 'kyc_rejection_reason',
            'is_online', 'current_lat', 'current_lng',
            'background_check_flagged', 'created_at', 'updated_at',
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        data['kyc_id_photo'] = resolve_storage_url(data.get('kyc_id_photo'), request=request)
        data['kyc_selfie_photo'] = resolve_storage_url(data.get('kyc_selfie_photo'), request=request)
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'id', 'user', 'full_name', 'birthday', 'home_address',
            'home_lat', 'home_lng',
            'kyc_status', 'kyc_id_type', 'kyc_id_photo', 'kyc_selfie_photo',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user', 'kyc_status', 'created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        data['kyc_id_photo'] = resolve_storage_url(data.get('kyc_id_photo'), request=request)
        data['kyc_selfie_photo'] = resolve_storage_url(data.get('kyc_selfie_photo'), request=request)
        return data


# ═══════════════════════════════════════════════════════════════════
# KYC UPLOAD SERIALIZER
# ═══════════════════════════════════════════════════════════════════
class KYCUploadSerializer(serializers.Serializer):
    kyc_id_photo = serializers.ImageField(required=False)
    kyc_selfie_photo = serializers.ImageField(required=False)
    kyc_business_doc = serializers.FileField(required=False)
    document = serializers.FileField(required=False, write_only=True)
    kyc_id_type = serializers.CharField(max_length=50, required=False)

    MAX_FILE_SIZE = 10 * 1024 * 1024
    IMAGE_MIME_TYPES = {'image/jpeg', 'image/png', 'image/webp'}
    DOC_MIME_TYPES = IMAGE_MIME_TYPES | {'application/pdf'}

    def _validate_file(self, file_obj, allowed_types: set[str], field_name: str):
        content_type = getattr(file_obj, 'content_type', '') or ''
        if file_obj.size > self.MAX_FILE_SIZE:
            raise serializers.ValidationError({field_name: 'File exceeds 10MB size limit.'})

        if content_type not in allowed_types:
            raise serializers.ValidationError({field_name: 'Unsupported file type.'})

    def validate(self, attrs):
        file_fields = ['kyc_id_photo', 'kyc_selfie_photo', 'kyc_business_doc', 'document']
        if not any(attrs.get(field_name) for field_name in file_fields):
            raise serializers.ValidationError('At least one document file is required.')

        if attrs.get('kyc_id_photo'):
            self._validate_file(attrs['kyc_id_photo'], self.IMAGE_MIME_TYPES, 'kyc_id_photo')

        if attrs.get('kyc_selfie_photo'):
            self._validate_file(attrs['kyc_selfie_photo'], self.IMAGE_MIME_TYPES, 'kyc_selfie_photo')

        if attrs.get('kyc_business_doc'):
            self._validate_file(attrs['kyc_business_doc'], self.DOC_MIME_TYPES, 'kyc_business_doc')

        if attrs.get('document'):
            self._validate_file(attrs['document'], self.DOC_MIME_TYPES, 'document')

        return attrs
