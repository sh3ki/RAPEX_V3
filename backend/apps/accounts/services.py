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
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.exceptions import InvalidOTP, OTPExpired, OTPRateLimitExceeded, RapexAPIException

from .models import (
    AdminProfile,
    CustomUser,
    MerchantProfile,
    OTPRecord,
    RiderProfile,
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
    def login(phone: str, password: str) -> dict:
        """Authenticate user and return JWT tokens."""
        try:
            user = CustomUser.objects.get(phone=phone)
        except CustomUser.DoesNotExist:
            raise RapexAPIException('Invalid credentials.', code='invalid_credentials', status_code=401)

        if not user.check_password(password):
            raise RapexAPIException('Invalid credentials.', code='invalid_credentials', status_code=401)

        if not user.is_active:
            raise RapexAPIException('Account is deactivated.', code='account_inactive', status_code=403)

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        refresh['role'] = user.role
        refresh['phone'] = user.phone

        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        logger.info(f"User logged in: {phone} ({user.role})")
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': str(user.id),
                'phone': user.phone,
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
