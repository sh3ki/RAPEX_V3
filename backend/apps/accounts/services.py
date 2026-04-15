"""
RAPEX Accounts — Services
All auth/registration/OTP business logic.
"""
import hashlib
import logging
import random
import string
from datetime import timedelta

import requests
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.utils.crypto import get_random_string
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.constants import Roles
from apps.core.exceptions import InvalidOTP, OTPExpired, OTPRateLimitExceeded, RapexAPIException

from .models import (
    AdminProfile,
    CustomUser,
    MerchantProfile,
    OTPRecord,
    RiderProfile,
    SocialAccount,
    SuperAdminProfile,
    UserProfile,
)

logger = logging.getLogger(__name__)


class OTPService:
    """Handles OTP generation, delivery, and verification."""

    @staticmethod
    def request_otp(phone: str, purpose: str) -> dict:
        """
        Generate and send OTP to phone number.
        Rate limit: 3 attempts per 15 minutes.
        """
        # Rate limiting check
        window_start = timezone.now() - timedelta(seconds=settings.RAPEX_OTP_RATE_LIMIT_WINDOW)
        recent_count = OTPRecord.objects.filter(
            phone=phone,
            created_at__gte=window_start,
        ).count()

        if recent_count >= settings.RAPEX_OTP_MAX_ATTEMPTS:
            raise OTPRateLimitExceeded()

        # Generate 6-digit OTP
        otp_code = ''.join(random.choices(string.digits, k=6))
        expires_at = timezone.now() + timedelta(seconds=settings.RAPEX_OTP_EXPIRY_SECONDS)

        # Save OTP record
        otp_record = OTPRecord.objects.create(
            phone=phone,
            otp_code=otp_code,
            purpose=purpose,
            expires_at=expires_at,
        )

        # Send via Semaphore SMS (Philippines)
        OTPService._send_sms(phone, otp_code)

        logger.info(f"OTP sent to {phone} for {purpose}")
        return {
            'message': 'OTP sent successfully.',
            'expires_in': settings.RAPEX_OTP_EXPIRY_SECONDS,
        }

    @staticmethod
    def verify_otp(phone: str, otp_code: str, purpose: str) -> dict:
        """
        Verify OTP and return a temporary token (10-min JWT).
        """
        otp_record = OTPRecord.objects.filter(
            phone=phone,
            purpose=purpose,
            is_used=False,
        ).order_by('-created_at').first()

        if not otp_record:
            raise InvalidOTP()

        if otp_record.is_expired:
            raise OTPExpired()

        if otp_record.otp_code != otp_code:
            otp_record.attempt_count += 1
            otp_record.save(update_fields=['attempt_count'])
            if otp_record.attempt_count >= 3:
                otp_record.is_used = True
                otp_record.save(update_fields=['is_used'])
            raise InvalidOTP()

        # Mark as used
        otp_record.is_used = True
        otp_record.save(update_fields=['is_used'])

        # Generate temporary token (10-min expiry)
        temp_token = OTPService._generate_temp_token(phone, purpose)

        logger.info(f"OTP verified for {phone} ({purpose})")
        return {
            'message': 'OTP verified successfully.',
            'temp_token': temp_token,
        }

    @staticmethod
    def _generate_temp_token(phone: str, purpose: str) -> str:
        """Generate a short-lived JWT as temp_token for registration."""
        from rest_framework_simplejwt.tokens import AccessToken

        token = AccessToken()
        token.set_exp(lifetime=timedelta(minutes=10))
        token['phone'] = phone
        token['purpose'] = purpose
        token['type'] = 'temp_otp'
        return str(token)

    @staticmethod
    def _send_sms(phone: str, otp_code: str):
        """Send OTP via Semaphore SMS API."""
        api_key = settings.SEMAPHORE_API_KEY
        if not api_key or api_key == 'your-semaphore-api-key':
            logger.warning(f"[DEV] SMS not sent — OTP for {phone}: {otp_code}")
            return

        try:
            response = requests.post(
                'https://api.semaphore.co/api/v4/messages',
                data={
                    'apikey': api_key,
                    'number': phone,
                    'message': f'Your RAPEX verification code is: {otp_code}. Valid for 5 minutes.',
                    'sendername': settings.SEMAPHORE_SENDER_NAME,
                },
                timeout=10,
            )
            response.raise_for_status()
            logger.info(f"SMS sent to {phone} via Semaphore")
        except Exception as e:
            logger.error(f"Failed to send SMS to {phone}: {e}")


class AuthService:
    """Handles user registration and authentication."""

    @staticmethod
    @transaction.atomic
    def register_user(phone: str, password: str, full_name: str, **kwargs) -> CustomUser:
        """Register a new User account."""
        if CustomUser.objects.filter(phone=phone).exists():
            raise RapexAPIException('Phone number already registered.', code='phone_exists')

        user = CustomUser.objects.create_user(
            phone=phone,
            password=password,
            role='USER',
            is_verified=True,
        )
        UserProfile.objects.create(
            user=user,
            full_name=full_name,
            birthday=kwargs.get('birthday'),
            home_address=kwargs.get('home_address', ''),
        )

        logger.info(f"User registered: {phone}")
        return user

    @staticmethod
    @transaction.atomic
    def register_merchant(phone: str, password: str, full_name: str, **kwargs) -> CustomUser:
        """Register a new Merchant account."""
        if CustomUser.objects.filter(phone=phone).exists():
            raise RapexAPIException('Phone number already registered.', code='phone_exists')

        user = CustomUser.objects.create_user(
            phone=phone,
            password=password,
            role='MERCHANT',
            is_verified=True,
        )
        MerchantProfile.objects.create(
            user=user,
            full_name=full_name,
            birthday=kwargs.get('birthday'),
            home_address=kwargs.get('home_address', ''),
            business_name=kwargs.get('business_name', ''),
            business_address=kwargs.get('business_address', ''),
            business_lat=kwargs.get('business_lat'),
            business_lng=kwargs.get('business_lng'),
        )

        logger.info(f"Merchant registered: {phone}")
        return user

    @staticmethod
    @transaction.atomic
    def register_rider(phone: str, password: str, full_name: str, **kwargs) -> CustomUser:
        """Register a new Rider account."""
        if CustomUser.objects.filter(phone=phone).exists():
            raise RapexAPIException('Phone number already registered.', code='phone_exists')

        user = CustomUser.objects.create_user(
            phone=phone,
            password=password,
            role='RIDER',
            is_verified=True,
        )
        RiderProfile.objects.create(
            user=user,
            full_name=full_name,
            birthday=kwargs.get('birthday'),
            home_address=kwargs.get('home_address', ''),
            emergency_contact_name=kwargs.get('emergency_contact_name', ''),
            emergency_contact_phone=kwargs.get('emergency_contact_phone', ''),
            vehicle_type=kwargs.get('vehicle_type', 'MOTORCYCLE'),
            vehicle_plate=kwargs.get('vehicle_plate'),
            vehicle_model=kwargs.get('vehicle_model'),
        )

        logger.info(f"Rider registered: {phone}")
        return user

    @staticmethod
    def login(email: str, password: str) -> dict:
        """Authenticate user by email and return JWT tokens."""
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            raise RapexAPIException('Invalid credentials.', code='invalid_credentials', status_code=401)

        if not user.check_password(password):
            raise RapexAPIException('Invalid credentials.', code='invalid_credentials', status_code=401)

        if not user.is_active:
            raise RapexAPIException('Account is deactivated.', code='account_inactive', status_code=403)

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        refresh['role'] = user.role
        refresh['email'] = user.email

        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        logger.info(f"User logged in: {email} ({user.role})")
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': str(user.id),
                'email': user.email,
                'phone': user.phone,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'avatar_url': user.avatar_url,
                'role': user.role,
                'is_verified': user.is_verified,
            },
        }

    @staticmethod
    def login_by_user(user) -> dict:
        """Generate JWT tokens directly from a user object (used after registration)."""
        if not user.is_active:
            raise RapexAPIException('Account is deactivated.', code='account_inactive', status_code=403)

        refresh = RefreshToken.for_user(user)
        refresh['role'] = user.role
        refresh['email'] = user.email

        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': str(user.id),
                'email': user.email,
                'phone': user.phone,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'avatar_url': user.avatar_url,
                'role': user.role,
                'is_verified': user.is_verified,
            },
        }

    @staticmethod
    def logout(refresh_token: str) -> dict:
        """Blacklist the refresh token."""
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return {'message': 'Logged out successfully.'}
        except Exception:
            raise RapexAPIException('Invalid token.', code='invalid_token')


class DeviceFingerprintService:
    """Generates and validates device fingerprints."""

    @staticmethod
    def generate(device_id: str, user_agent: str, platform: str) -> str:
        raw = f"{device_id}:{user_agent}:{platform}"
        return hashlib.sha256(raw.encode()).hexdigest()

    @staticmethod
    def validate(request, user) -> bool:
        device_id = request.META.get('HTTP_X_DEVICE_ID', '')
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        platform = request.META.get('HTTP_X_PLATFORM', '')

        if not device_id:
            return True  # Skip validation if no device_id header

        fingerprint = DeviceFingerprintService.generate(device_id, user_agent, platform)
        return user.device_id == fingerprint


class GoogleAuthService:
    """Handles Google Sign-In and Sign-Up flows."""

    @staticmethod
    def _verify_google_token(id_token: str) -> dict:
        client_ids = [client_id.strip() for client_id in settings.GOOGLE_OAUTH_CLIENT_IDS if client_id.strip()]
        if not client_ids:
            raise RapexAPIException(
                'Google authentication is not configured.',
                code='google_not_configured',
                status_code=503,
            )

        token_info = None
        for client_id in client_ids:
            try:
                token_info = google_id_token.verify_oauth2_token(id_token, google_requests.Request(), client_id)
                break
            except Exception:
                continue

        if not token_info:
            raise RapexAPIException('Invalid Google token.', code='invalid_google_token', status_code=401)

        if token_info.get('iss') not in ('accounts.google.com', 'https://accounts.google.com'):
            raise RapexAPIException('Invalid token issuer.', code='invalid_google_issuer', status_code=401)

        email = (token_info.get('email') or '').lower()
        if not email:
            raise RapexAPIException('Google account has no email.', code='google_email_missing', status_code=400)

        if not token_info.get('email_verified', False):
            raise RapexAPIException('Google email is not verified.', code='google_email_not_verified', status_code=403)

        return {
            'sub': token_info.get('sub'),
            'email': email,
            'email_verified': bool(token_info.get('email_verified', False)),
            'full_name': token_info.get('name') or '',
            'given_name': token_info.get('given_name') or '',
            'family_name': token_info.get('family_name') or '',
            'picture': token_info.get('picture') or '',
            'raw': token_info,
        }

    @staticmethod
    def _sync_user_identity_fields(user: CustomUser, google_data: dict) -> None:
        changed_fields = []

        if google_data.get('email') and user.email != google_data['email']:
            user.email = google_data['email']
            changed_fields.append('email')

        if google_data.get('given_name') and user.first_name != google_data['given_name']:
            user.first_name = google_data['given_name']
            changed_fields.append('first_name')

        if google_data.get('family_name') and user.last_name != google_data['family_name']:
            user.last_name = google_data['family_name']
            changed_fields.append('last_name')

        if google_data.get('picture') and user.avatar_url != google_data['picture']:
            user.avatar_url = google_data['picture']
            changed_fields.append('avatar_url')

        if changed_fields:
            user.save(update_fields=changed_fields)

    @staticmethod
    def _sync_social_account(user: CustomUser, google_data: dict) -> SocialAccount:
        existing = SocialAccount.objects.filter(
            provider=SocialAccount.Provider.GOOGLE,
            provider_user_id=google_data['sub'],
        ).first()
        if existing and existing.user_id != user.id:
            raise RapexAPIException('Google account already linked to another user.', code='google_account_conflict', status_code=409)

        social_account, _ = SocialAccount.objects.update_or_create(
            provider=SocialAccount.Provider.GOOGLE,
            provider_user_id=google_data['sub'],
            defaults={
                'user': user,
                'email': google_data['email'],
                'email_verified': google_data['email_verified'],
                'picture_url': google_data.get('picture', ''),
                'extra_data': google_data.get('raw', {}),
                'last_login_at': timezone.now(),
            },
        )
        return social_account

    @staticmethod
    def _ensure_profile(user: CustomUser, role: str, full_name: str, extra_data: dict) -> None:
        if role == Roles.USER:
            UserProfile.objects.get_or_create(user=user, defaults={'full_name': full_name})
        elif role == Roles.MERCHANT:
            MerchantProfile.objects.get_or_create(
                user=user,
                defaults={
                    'full_name': full_name,
                    'business_name': extra_data.get('business_name', ''),
                },
            )
        elif role == Roles.RIDER:
            RiderProfile.objects.get_or_create(user=user, defaults={'full_name': full_name})
        elif role == Roles.ADMIN:
            AdminProfile.objects.get_or_create(
                user=user,
                defaults={
                    'full_name': full_name,
                    'sub_role': extra_data.get('admin_sub_role') or AdminProfile.SubRole.OPERATIONS,
                },
            )
        elif role == Roles.SUPERADMIN:
            SuperAdminProfile.objects.get_or_create(user=user, defaults={'full_name': full_name})

    @staticmethod
    def login(id_token: str, role: str | None = None) -> dict:
        google_data = GoogleAuthService._verify_google_token(id_token)

        social_account = SocialAccount.objects.select_related('user').filter(
            provider=SocialAccount.Provider.GOOGLE,
            provider_user_id=google_data['sub'],
        ).first()

        user = social_account.user if social_account else None
        if not user:
            user = CustomUser.objects.filter(email=google_data['email']).first()
            if user:
                GoogleAuthService._sync_social_account(user, google_data)

        if not user:
            raise RapexAPIException(
                'No account is linked to this Google email. Please sign up first.',
                code='google_signup_required',
                status_code=404,
            )

        if role and user.role != role:
            raise RapexAPIException('This Google account belongs to a different role.', code='role_mismatch', status_code=403)

        GoogleAuthService._sync_user_identity_fields(user, google_data)
        GoogleAuthService._sync_social_account(user, google_data)
        return AuthService.login_by_user(user)

    @staticmethod
    @transaction.atomic
    def signup(
        id_token: str,
        role: str,
        phone: str,
        otp_code: str,
        full_name: str = '',
        extra_data: dict | None = None,
    ) -> dict:
        extra_data = extra_data or {}
        google_data = GoogleAuthService._verify_google_token(id_token)

        if role in (Roles.ADMIN, Roles.SUPERADMIN) and not settings.GOOGLE_ALLOW_PRIVILEGED_SIGNUP:
            raise RapexAPIException(
                'Google signup for Admin/SuperAdmin is disabled.',
                code='privileged_google_signup_disabled',
                status_code=403,
            )

        OTPService.verify_otp(phone=phone, otp_code=otp_code, purpose=OTPRecord.Purpose.REGISTRATION)

        social_account = SocialAccount.objects.select_related('user').filter(
            provider=SocialAccount.Provider.GOOGLE,
            provider_user_id=google_data['sub'],
        ).first()
        if social_account:
            user = social_account.user
            if user.role != role:
                raise RapexAPIException('This Google account is already linked to another role.', code='role_mismatch', status_code=403)
            GoogleAuthService._sync_user_identity_fields(user, google_data)
            return AuthService.login_by_user(user)

        existing_email_user = CustomUser.objects.filter(email=google_data['email']).first()
        if existing_email_user and existing_email_user.role != role:
            raise RapexAPIException('Email already belongs to another role account.', code='email_role_conflict', status_code=409)

        if existing_email_user:
            if existing_email_user.phone != phone:
                if CustomUser.objects.filter(phone=phone).exclude(pk=existing_email_user.pk).exists():
                    raise RapexAPIException('Phone number already registered.', code='phone_exists', status_code=409)
                existing_email_user.phone = phone
                existing_email_user.save(update_fields=['phone'])

            user = existing_email_user
        else:
            if CustomUser.objects.filter(phone=phone).exists():
                raise RapexAPIException('Phone number already registered.', code='phone_exists', status_code=409)

            user = CustomUser.objects.create_user(
                phone=phone,
                role=role,
                email=google_data['email'],
                is_verified=True,
                first_name=google_data.get('given_name', ''),
                last_name=google_data.get('family_name', ''),
                avatar_url=google_data.get('picture', ''),
            )
            user.set_unusable_password()
            user.save(update_fields=['password'])

        profile_name = (full_name or google_data.get('full_name') or '').strip()
        if not profile_name:
            profile_name = (f"{user.first_name} {user.last_name}".strip() or google_data['email'])

        GoogleAuthService._sync_user_identity_fields(user, google_data)
        GoogleAuthService._ensure_profile(user, role, profile_name, extra_data)
        GoogleAuthService._sync_social_account(user, google_data)

        if not user.device_id:
            user.device_id = get_random_string(32)
            user.save(update_fields=['device_id'])

        return AuthService.login_by_user(user)
