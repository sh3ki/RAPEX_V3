"""RAPEX Merchant Module — Services"""
import logging
import math
import re
from decimal import Decimal

from django.db import transaction
from django.db.models import F, FloatField, Value
from django.db.models.functions import ACos, Cos, Radians, Sin
from django.utils import timezone

from apps.core.exceptions import MaxStoresReached, RapexAPIException
from apps.core.storage import normalize_storage_path, save_upload
from apps.accounts.models import CustomUser, OTPRecord
from apps.accounts.services import OTPService

from .models import (
    MerchantStore,
    MerchantBusinessCategory,
    MerchantBusinessType,
    MerchantBusinessProfile,
    MerchantLocation,
    MerchantDocument,
    MerchantOnboardingState,
)

logger = logging.getLogger(__name__)

MAX_STORES = 4

MERCHANT_DOCUMENT_SEGMENT_MAP = {
    'SELFIE_WITH_ID': ('files', 'valid_id', 'selfie_with_id'),
    'VALID_ID_FRONT': ('files', 'valid_id', 'front'),
    'VALID_ID_BACK': ('files', 'valid_id', 'back'),
    'BARANGAY_PERMIT': ('files', 'business_permits', 'barangay'),
    'DTI_OR_SEC': ('files', 'business_registration', 'dti_or_sec'),
    'BIR_2303': ('files', 'tax_documents', 'bir_2303'),
    'MAYORS_PERMIT': ('files', 'business_permits', 'mayors_permit'),
    'OTHER': ('files', 'other_documents'),
}


class MerchantService:
    PASSWORD_COMPLEXITY_RE = re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$')

    @staticmethod
    def _notify_admins_step_updated(merchant_profile, step_label: str) -> None:
        """Fire-and-forget realtime nudge so admins see onboarding progress updates."""
        from apps.notifications.services import NotificationService

        user = merchant_profile.user
        merchant_display = (merchant_profile.business_name or user.email or f'Merchant {user.id}').strip()
        NotificationService.send_to_role(
            'ADMIN',
            'merchant.onboarding_step_updated',
            data={
                'merchant_id': str(user.id),
                'merchant_display': merchant_display,
                'step_label': step_label,
            },
        )

    @staticmethod
    def _pending_merchant_kyc_count() -> int:
        from apps.accounts.models import MerchantProfile

        return MerchantProfile.objects.filter(
            is_deleted=False,
            kyc_status='PENDING',
            wizard_completed=True,
        ).count()

    @staticmethod
    def _validate_password_strength(password: str):
        if not MerchantService.PASSWORD_COMPLEXITY_RE.match(password):
            raise RapexAPIException(
                'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
                code='weak_password',
                status_code=400,
            )

    @staticmethod
    def create_store(merchant, store_type: str, data: dict) -> MerchantStore:
        """Create a store, enforcing max-store and uniqueness limits."""
        existing_count = MerchantStore.objects.filter(
            merchant=merchant, is_deleted=False,
        ).count()
        if existing_count >= MAX_STORES:
            raise MaxStoresReached()

        if MerchantStore.objects.filter(
            merchant=merchant, store_type=store_type, is_deleted=False,
        ).exists():
            raise RapexAPIException(
                f'You already have a {store_type} store.',
                code='duplicate_store_type',
            )

        store = MerchantStore.objects.create(
            merchant=merchant,
            store_type=store_type,
            **data,
        )
        logger.info(f"Store created: {store.display_name} ({store_type}) for merchant {merchant.id}")
        return store

    @staticmethod
    def toggle_open(store: MerchantStore, is_open: bool):
        store.is_open = is_open
        store.save(update_fields=['is_open', 'updated_at'])
        logger.info(f"Store {store.id} is_open → {is_open}")

    @staticmethod
    def upload_store_asset(store: MerchantStore, upload_file, asset_type: str) -> str:
        normalized_asset_type = str(asset_type or '').lower().strip()
        if normalized_asset_type not in {'logo', 'banner'}:
            raise RapexAPIException('Unsupported store asset type.', code='invalid_store_asset', status_code=400)

        stored_path = save_upload(
            upload_file,
            'merchant',
            str(store.merchant_id),
            'stores',
            str(store.id),
            'assets',
            normalized_asset_type,
            'images',
            stem=normalized_asset_type,
        )

        if normalized_asset_type == 'logo':
            store.logo_url = stored_path
            store.save(update_fields=['logo_url', 'updated_at'])
        else:
            store.banner_url = stored_path
            store.save(update_fields=['banner_url', 'updated_at'])

        return stored_path

    @staticmethod
    def upload_product_image(store: MerchantStore, upload_file) -> str:
        return save_upload(
            upload_file,
            'merchant',
            str(store.merchant_id),
            'stores',
            str(store.id),
            'products',
            store.store_type.lower(),
            'media',
            'images',
            stem='image',
        )

    @staticmethod
    def get_nearby_stores(lat: float, lng: float, radius_km: float = 5.0, store_type: str = None):
        """
        Haversine distance query — return open & visible stores within radius.
        """
        lat_r = math.radians(lat)
        lng_r = math.radians(lng)

        qs = MerchantStore.objects.filter(
            is_open=True, is_visible=True, is_deleted=False,
            merchant__business_lat__isnull=False,
            merchant__business_lng__isnull=False,
        )
        if store_type:
            qs = qs.filter(store_type=store_type)

        # Annotate with Haversine distance
        qs = qs.annotate(
            distance_km=Value(6371.0, output_field=FloatField()) * ACos(
                Cos(Radians(Value(lat, output_field=FloatField()))) *
                Cos(Radians(F('merchant__business_lat'))) *
                Cos(Radians(F('merchant__business_lng')) - Radians(Value(lng, output_field=FloatField()))) +
                Sin(Radians(Value(lat, output_field=FloatField()))) *
                Sin(Radians(F('merchant__business_lat')))
            )
        ).filter(distance_km__lte=radius_km).order_by('distance_km')

        return qs

    @staticmethod
    def get_or_create_onboarding_state(merchant_profile):
        state, _ = MerchantOnboardingState.objects.get_or_create(merchant=merchant_profile)
        return state

    @staticmethod
    def _assert_onboarding_editable(state: MerchantOnboardingState):
        if state.is_submitted and not state.can_resubmit:
            raise RapexAPIException(
                'Your onboarding is already submitted. Wait for admin action or resubmission request.',
                code='onboarding_locked',
                status_code=403,
            )

    @staticmethod
    def upload_onboarding_document(merchant_profile, document_type: str, upload_file):
        state = MerchantService.get_or_create_onboarding_state(merchant_profile)
        MerchantService._assert_onboarding_editable(state)

        document_key = str(document_type or '').upper()
        segments = MERCHANT_DOCUMENT_SEGMENT_MAP.get(document_key, ('files', 'other_documents'))

        return save_upload(
            upload_file,
            'merchant',
            str(merchant_profile.id),
            *segments,
            stem=document_key.lower() or 'document',
        )

    @staticmethod
    def upload_profile_image(merchant_profile, upload_file):
        state = MerchantService.get_or_create_onboarding_state(merchant_profile)
        MerchantService._assert_onboarding_editable(state)

        return save_upload(
            upload_file,
            'merchant',
            str(merchant_profile.id),
            'profile',
            'images',
            stem='profile-image',
        )

    @staticmethod
    @transaction.atomic
    def save_profile_step(merchant_profile, validated_data: dict):
        state = MerchantService.get_or_create_onboarding_state(merchant_profile)
        MerchantService._assert_onboarding_editable(state)

        user = merchant_profile.user
        previous_email = (user.email or '').strip().lower()
        previous_phone = (user.phone or '').strip()
        username = validated_data['username'].strip()
        phone_number = validated_data['phone_number'].strip()
        password = (validated_data.get('password') or '').strip()
        confirm_password = (validated_data.get('confirm_password') or '').strip()
        submitted_email = validated_data['email'].strip().lower()

        has_saved_password = user.has_usable_password()
        update_password = bool(password or confirm_password)

        if update_password:
            if not password or not confirm_password:
                raise RapexAPIException(
                    'Password and confirm password are both required when updating password.',
                    code='password_required',
                    status_code=400,
                )
            if password != confirm_password:
                raise RapexAPIException('Password and confirm password do not match.', code='password_mismatch', status_code=400)
            MerchantService._validate_password_strength(password)
        elif not has_saved_password:
            raise RapexAPIException('Password is required for initial onboarding setup.', code='password_required', status_code=400)

        if CustomUser.objects.filter(username=username).exclude(pk=user.pk).exists():
            raise RapexAPIException('Username already exists.', code='username_exists', status_code=409)

        if CustomUser.objects.filter(phone=phone_number).exclude(pk=user.pk).exists():
            raise RapexAPIException('Phone number already exists.', code='phone_exists', status_code=409)

        if user.google_id and user.email and submitted_email != user.email.lower():
            raise RapexAPIException('Email cannot be edited for Google-linked accounts.', code='email_readonly', status_code=400)
        if user.email != submitted_email and CustomUser.objects.filter(email__iexact=submitted_email).exclude(pk=user.pk).exists():
            raise RapexAPIException('Email already exists.', code='email_exists', status_code=409)

        user.first_name = validated_data['first_name'].strip()
        user.last_name = validated_data['last_name'].strip()
        user.username = username
        user.phone = phone_number
        user.email = submitted_email
        image_url = normalize_storage_path(validated_data.get('profile_image_url', '').strip())
        if image_url:
            user.avatar_url = image_url
            user.profile_image_url = image_url
        update_fields = ['first_name', 'last_name', 'username', 'phone', 'email', 'avatar_url', 'profile_image_url']
        if update_password:
            user.set_password(password)
            update_fields.append('password')

        user.save(update_fields=update_fields)

        middle_name = validated_data.get('middle_name', '').strip()
        merchant_profile.full_name = ' '.join(
            [x for x in [user.first_name, middle_name, user.last_name] if x]
        ).strip()
        merchant_profile.save(update_fields=['full_name'])

        state.current_step = max(state.current_step, 2)
        draft = state.draft_payload or {}
        draft['step1_profile'] = {
            'profile_image_url': image_url,
            'first_name': user.first_name,
            'middle_name': middle_name,
            'last_name': user.last_name,
            'email': user.email,
            'username': user.username,
            'phone_number': user.phone,
        }
        state.draft_payload = draft

        state_update_fields = ['current_step', 'draft_payload']
        if submitted_email != previous_email and state.email_verified:
            state.email_verified = False
            state_update_fields.append('email_verified')

        if phone_number != previous_phone and state.phone_verified:
            state.phone_verified = False
            state_update_fields.append('phone_verified')

        state.save(update_fields=state_update_fields)
        transaction.on_commit(lambda: MerchantService._notify_admins_step_updated(merchant_profile, 'Profile'))
        return state

    @staticmethod
    @transaction.atomic
    def save_business_step(merchant_profile, validated_data: dict):
        state = MerchantService.get_or_create_onboarding_state(merchant_profile)
        MerchantService._assert_onboarding_editable(state)

        categories = list(MerchantBusinessCategory.objects.filter(id__in=validated_data['category_ids'], is_active=True))
        business_types = list(MerchantBusinessType.objects.filter(id__in=validated_data['business_type_ids'], is_active=True))

        if not categories:
            raise RapexAPIException('At least one business category is required.', code='category_required', status_code=400)
        if not business_types:
            raise RapexAPIException('At least one business type is required.', code='type_required', status_code=400)

        allowed_category_ids = {str(item.id) for item in categories}
        for item in business_types:
            if str(item.category_id) not in allowed_category_ids:
                raise RapexAPIException(
                    'Selected business type does not match selected categories.',
                    code='type_category_mismatch',
                    status_code=400,
                )

        business_profile, _ = MerchantBusinessProfile.objects.get_or_create(
            merchant=merchant_profile,
            defaults={'business_name': validated_data['business_name']},
        )
        business_profile.business_name = validated_data['business_name'].strip()
        business_profile.registration_type = validated_data['registration_type']
        business_profile.save(update_fields=['business_name', 'registration_type'])
        business_profile.categories.set(categories)
        business_profile.business_types.set(business_types)

        state.current_step = max(state.current_step, 3)
        draft = state.draft_payload or {}
        draft['step2_business'] = {
            'business_name': business_profile.business_name,
            'registration_type': business_profile.registration_type,
            'category_ids': [str(item.id) for item in categories],
            'business_type_ids': [str(item.id) for item in business_types],
        }
        state.draft_payload = draft
        state.save(update_fields=['current_step', 'draft_payload'])
        transaction.on_commit(lambda: MerchantService._notify_admins_step_updated(merchant_profile, 'Business'))
        return state

    @staticmethod
    @transaction.atomic
    def save_location_step(merchant_profile, validated_data: dict):
        state = MerchantService.get_or_create_onboarding_state(merchant_profile)
        MerchantService._assert_onboarding_editable(state)

        location, _ = MerchantLocation.objects.get_or_create(merchant=merchant_profile)
        for key, value in validated_data.items():
            setattr(location, key, value)
        location.save()

        state.current_step = max(state.current_step, 4)
        draft = state.draft_payload or {}
        draft['step3_location'] = {
            key: str(value) if value is not None else ''
            for key, value in validated_data.items()
        }
        state.draft_payload = draft
        state.save(update_fields=['current_step', 'draft_payload'])
        transaction.on_commit(lambda: MerchantService._notify_admins_step_updated(merchant_profile, 'Location'))
        return state

    @staticmethod
    @transaction.atomic
    def save_documents_step(merchant_profile, validated_data: dict):
        state = MerchantService.get_or_create_onboarding_state(merchant_profile)
        MerchantService._assert_onboarding_editable(state)

        MerchantDocument.objects.filter(merchant=merchant_profile, is_deleted=False).update(is_deleted=True)
        records = []
        for item in validated_data['documents']:
            records.append(
                MerchantDocument(
                    merchant=merchant_profile,
                    document_type=item['document_type'],
                    file_url=normalize_storage_path(item['file_url']),
                    is_optional=item.get('is_optional', False),
                )
            )
        MerchantDocument.objects.bulk_create(records)

        state.current_step = max(state.current_step, 5)
        draft = state.draft_payload or {}
        draft['step4_documents'] = validated_data['documents']
        state.draft_payload = draft
        state.save(update_fields=['current_step', 'draft_payload'])
        transaction.on_commit(lambda: MerchantService._notify_admins_step_updated(merchant_profile, 'Documents'))
        return state

    @staticmethod
    def send_verification_otps(merchant_profile, channel: str = 'BOTH'):
        normalized_channel = str(channel or 'BOTH').upper().strip()
        if normalized_channel not in {'EMAIL', 'PHONE', 'BOTH'}:
            raise RapexAPIException('Invalid OTP channel.', code='invalid_otp_channel', status_code=400)

        user = merchant_profile.user
        results = {}

        if normalized_channel in {'EMAIL', 'BOTH'}:
            if not user.email:
                raise RapexAPIException('Email is required before verification.', code='email_required', status_code=400)
            results['email'] = OTPService.request_email_otp(user.email, OTPRecord.Purpose.EMAIL_VERIFICATION)

        if normalized_channel in {'PHONE', 'BOTH'}:
            if not user.phone:
                raise RapexAPIException('Phone number is required before verification.', code='phone_required', status_code=400)
            results['phone'] = OTPService.request_otp(user.phone, OTPRecord.Purpose.PHONE_VERIFICATION)

        return results

    @staticmethod
    @transaction.atomic
    def verify_verification_otp(merchant_profile, channel: str, otp_code: str):
        state = MerchantService.get_or_create_onboarding_state(merchant_profile)
        MerchantService._assert_onboarding_editable(state)

        normalized_channel = str(channel or '').upper().strip()
        normalized_code = str(otp_code or '').strip()
        if normalized_channel not in {'EMAIL', 'PHONE'}:
            raise RapexAPIException('Invalid OTP channel.', code='invalid_otp_channel', status_code=400)

        if len(normalized_code) != 6 or not normalized_code.isdigit():
            raise RapexAPIException('OTP code must be a 6-digit number.', code='invalid_otp', status_code=400)

        user = merchant_profile.user
        if normalized_channel == 'EMAIL':
            if state.email_verified:
                return state
            if not user.email:
                raise RapexAPIException('Email is required before verification.', code='email_required', status_code=400)
            OTPService.verify_email_otp(user.email, normalized_code, OTPRecord.Purpose.EMAIL_VERIFICATION)
            state.email_verified = True
            state.current_step = max(state.current_step, 5)
            state.save(update_fields=['email_verified', 'current_step'])
            return state

        if state.phone_verified:
            return state
        if not user.phone:
            raise RapexAPIException('Phone number is required before verification.', code='phone_required', status_code=400)

        OTPService.verify_otp(user.phone, normalized_code, OTPRecord.Purpose.PHONE_VERIFICATION)
        state.phone_verified = True
        state.current_step = max(state.current_step, 5)
        state.save(update_fields=['phone_verified', 'current_step'])
        return state

    @staticmethod
    @transaction.atomic
    def submit_onboarding(merchant_profile, email_otp: str = '', phone_otp: str = '', terms_accepted: bool = False, privacy_accepted: bool = False):
        state = MerchantService.get_or_create_onboarding_state(merchant_profile)
        MerchantService._assert_onboarding_editable(state)

        if not terms_accepted or not privacy_accepted:
            raise RapexAPIException(
                'You must agree to Terms and Privacy Policy before submission.',
                code='terms_required',
                status_code=400,
            )

        user = merchant_profile.user
        if not user.email or not user.phone:
            raise RapexAPIException('Email and phone are required before submission.', code='contact_required', status_code=400)

        normalized_email_otp = str(email_otp or '').strip()
        normalized_phone_otp = str(phone_otp or '').strip()

        if not state.email_verified:
            if len(normalized_email_otp) != 6 or not normalized_email_otp.isdigit():
                raise RapexAPIException('Please verify your email OTP before submission.', code='email_not_verified', status_code=400)
            OTPService.verify_email_otp(user.email, normalized_email_otp, OTPRecord.Purpose.EMAIL_VERIFICATION)
            state.email_verified = True

        if not state.phone_verified:
            if len(normalized_phone_otp) != 6 or not normalized_phone_otp.isdigit():
                raise RapexAPIException('Please verify your phone OTP before submission.', code='phone_not_verified', status_code=400)
            OTPService.verify_otp(user.phone, normalized_phone_otp, OTPRecord.Purpose.PHONE_VERIFICATION)
            state.phone_verified = True

        business_profile = MerchantBusinessProfile.objects.filter(merchant=merchant_profile).first()
        location = MerchantLocation.objects.filter(merchant=merchant_profile).first()
        if not business_profile or not location:
            raise RapexAPIException('Business and location steps must be completed before submission.', code='wizard_incomplete', status_code=400)

        merchant_profile.business_name = business_profile.business_name
        merchant_profile.business_lat = location.latitude
        merchant_profile.business_lng = location.longitude
        merchant_profile.business_address = ', '.join(
            [
                part for part in [
                    location.house_number,
                    location.street_name,
                    location.barangay,
                    location.city_municipality,
                    location.province,
                    location.zip_code,
                ] if part
            ]
        )
        merchant_profile.status = merchant_profile.AccountStatus.PENDING
        merchant_profile.kyc_status = 'PENDING'
        merchant_profile.kyc_rejection_reason = ''
        merchant_profile.wizard_completed = True
        merchant_profile.onboarding_submitted_at = timezone.now()
        merchant_profile.resubmission_requested = False
        merchant_profile.save()

        user.status = user.AccountStatus.PENDING
        user.wizard_completed = True
        user.save(update_fields=['status', 'wizard_completed'])

        state.is_submitted = True
        state.email_verified = True
        state.phone_verified = True
        state.terms_accepted = terms_accepted
        state.privacy_accepted = privacy_accepted
        state.submitted_at = timezone.now()
        state.current_step = 5
        state.can_resubmit = False
        state.admin_resubmission_note = ''
        state.save(
            update_fields=[
                'is_submitted',
                'email_verified',
                'phone_verified',
                'terms_accepted',
                'privacy_accepted',
                'submitted_at',
                'current_step',
                'can_resubmit',
                'admin_resubmission_note',
            ]
        )

        pending_kyc_count = MerchantService._pending_merchant_kyc_count()
        merchant_display = (merchant_profile.business_name or user.email or f'Merchant {user.id}').strip()

        def _notify_admins_onboarding_submitted():
            from apps.notifications.services import NotificationService

            NotificationService.send_to_role(
                'ADMIN',
                'merchant.onboarding_submitted',
                data={
                    'merchant_id': str(user.id),
                    'merchant_display': merchant_display,
                    'pending_kyc_count': pending_kyc_count,
                    'onboarding_completed': True,
                },
            )

        transaction.on_commit(_notify_admins_onboarding_submitted)

        return state
