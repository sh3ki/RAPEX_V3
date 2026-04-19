"""
RAPEX Accounts — Services
All auth/registration/OTP business logic.
"""
import hashlib
import logging
import random
import string
from datetime import timedelta
from urllib.parse import parse_qsl, urlencode, urljoin, urlparse, urlunparse

import requests
from django.conf import settings
from django.core.mail import EmailMultiAlternatives, send_mail
from django.db import transaction
from django.utils import timezone
from django.utils.crypto import get_random_string
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.constants import Roles
from apps.core.exceptions import InvalidOTP, OTPExpired, OTPRateLimitExceeded, RapexAPIException
from apps.core.localization import tr

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
    def _expiry_minutes(expiry_seconds: int) -> int:
        seconds = int(expiry_seconds or 0)
        if seconds <= 0:
            return 1
        return max(1, (seconds + 59) // 60)

    @staticmethod
    def _purpose_label(purpose: str) -> str:
        mapping = {
            OTPRecord.Purpose.EMAIL_VERIFICATION: 'email verification',
            OTPRecord.Purpose.PHONE_VERIFICATION: 'phone verification',
            OTPRecord.Purpose.REGISTRATION: 'account registration',
            OTPRecord.Purpose.LOGIN: 'login verification',
            OTPRecord.Purpose.RESET: 'password reset',
            OTPRecord.Purpose.MAGIC_LINK: 'secure sign-in',
        }
        return mapping.get(purpose, 'verification')

    @staticmethod
    def _build_sms_otp_message(otp_code: str, purpose: str, expiry_seconds: int) -> str:
        expiry_minutes = OTPService._expiry_minutes(expiry_seconds)
        purpose_label = OTPService._purpose_label(purpose)
        return (
            f'RAPEX Security Code: {otp_code}. '
            f'Use this for {purpose_label}. '
            f'Expires in {expiry_minutes} minutes. Do not share this code.'
        )

    @staticmethod
    def _build_email_otp_content(otp_code: str, purpose: str, expiry_seconds: int) -> tuple[str, str, str]:
        expiry_minutes = OTPService._expiry_minutes(expiry_seconds)
        purpose_label = OTPService._purpose_label(purpose)

        subject = 'RAPEX Security Verification Code'
        text_message = (
            'RAPEX Security Verification\n\n'
            f'Your one-time verification code is: {otp_code}\n\n'
            f'This code is for {purpose_label} and expires in {expiry_minutes} minutes.\n'
            'If you did not request this code, please ignore this message.\n\n'
            'For your security, never share this code with anyone.\n\n'
            'RAPEX Security Team'
        )

        html_message = f"""
<!doctype html>
<html>
    <body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                        <tr>
                            <td style="padding:20px 24px;background:#0f172a;color:#ffffff;">
                                <div style="font-size:14px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9;">RAPEX</div>
                                <div style="margin-top:6px;font-size:20px;font-weight:700;">Security Verification</div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:24px;">
                                <p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;color:#334155;">
                                    Use the one-time code below to complete your {purpose_label}.
                                </p>
                                <div style="margin:16px 0;padding:14px 16px;border:1px dashed #94a3b8;border-radius:10px;background:#f8fafc;text-align:center;">
                                    <span style="font-size:30px;font-weight:700;letter-spacing:0.22em;color:#0f172a;">{otp_code}</span>
                                </div>
                                <p style="margin:0 0 10px 0;font-size:13px;line-height:1.6;color:#475569;">
                                    This code expires in <strong>{expiry_minutes} minutes</strong>.
                                </p>
                                <p style="margin:0;font-size:13px;line-height:1.6;color:#475569;">
                                    If you did not request this code, you can safely ignore this email.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:14px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;line-height:1.5;">
                                For your protection, RAPEX will never ask for your OTP.
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>
""".strip()

        return subject, text_message, html_message

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
            channel=OTPRecord.Channel.SMS,
            otp_code=otp_code,
            purpose=purpose,
            expires_at=expires_at,
        )

        # Send via configured SMS provider (PhilSMS by default)
        delivered = OTPService._send_sms(
            phone=phone,
            otp_code=otp_code,
            purpose=purpose,
            expiry_seconds=settings.RAPEX_OTP_EXPIRY_SECONDS,
        )
        if not delivered:
            otp_record.delete()
            raise RapexAPIException(
                'SMS OTP service is not configured or delivery failed. Please configure PhilSMS or Semaphore credentials.',
                code='sms_otp_delivery_failed',
                status_code=503,
            )

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
            channel=OTPRecord.Channel.SMS,
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
    def _send_sms(phone: str, otp_code: str, purpose: str, expiry_seconds: int) -> bool:
        """Send OTP via configured provider (PhilSMS or Semaphore)."""
        provider = str(getattr(settings, 'SMS_PROVIDER', 'PHILSMS') or 'PHILSMS').upper().strip()
        message = OTPService._build_sms_otp_message(otp_code=otp_code, purpose=purpose, expiry_seconds=expiry_seconds)

        if provider == 'SEMAPHORE':
            return OTPService._send_sms_via_semaphore(phone, message)

        if provider == 'PHILSMS':
            if OTPService._send_sms_via_philsms(phone, message):
                return True

            # Automatic fallback to Semaphore if PhilSMS is unavailable.
            logger.warning('PhilSMS delivery failed or is not configured. Falling back to Semaphore provider.')
            return OTPService._send_sms_via_semaphore(phone, message)

        logger.warning(f"Unknown SMS_PROVIDER '{provider}'. Falling back to PhilSMS then Semaphore.")
        if OTPService._send_sms_via_philsms(phone, message):
            return True
        return OTPService._send_sms_via_semaphore(phone, message)

    @staticmethod
    def _send_sms_via_philsms(phone: str, message: str) -> bool:
        api_token = str(getattr(settings, 'PHILSMS_API_TOKEN', '') or '').strip()
        api_url = str(getattr(settings, 'PHILSMS_API_URL', '') or '').strip()

        if not api_token or not api_url or api_token == 'your-philsms-api-token':
            logger.warning(f"[DEV] PhilSMS not configured — OTP for {phone}: {message}")
            return False

        # Support OAuth-style tokens like "377|token-value".
        auth_token = api_token.split('|', 1)[1].strip() if '|' in api_token else api_token

        # Support either full send endpoint or base API root (e.g. .../api/v3/).
        normalized_url = api_url.rstrip('/')
        if normalized_url.endswith('/api/v3'):
            send_url = urljoin(f"{normalized_url}/", 'sms/send')
        else:
            send_url = api_url

        try:
            payload = {
                'recipient': phone,
                'sender_id': getattr(settings, 'PHILSMS_SENDER_ID', 'RAPEX'),
                'type': 'plain',
                'message': message,
            }

            response = requests.post(
                send_url,
                headers={
                    'Authorization': f'Bearer {auth_token}',
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                json=payload,
                timeout=10,
            )
            response.raise_for_status()

            # PhilSMS can return HTTP 200 with a JSON error payload.
            payload = {}
            try:
                payload = response.json() if response.content else {}
            except ValueError:
                payload = {}

            if isinstance(payload, dict):
                status = str(payload.get('status', '') or '').strip().lower()
                if status and status not in {'success', 'ok', 'queued'}:
                    logger.error(
                        "PhilSMS rejected message for %s: status=%s message=%s",
                        phone,
                        status,
                        payload.get('message'),
                    )
                    return False

                if 'error' in payload and payload.get('error'):
                    logger.error("PhilSMS error for %s: %s", phone, payload.get('error'))
                    return False

                message_text = str(payload.get('message', '') or '').strip().lower()
                if 'unauthenticated' in message_text:
                    logger.error("PhilSMS authentication failed for %s: %s", phone, payload.get('message'))
                    return False

                # Backward compatibility: some legacy endpoints may still expect form payload.
                if 'recipient field is required' in message_text:
                    legacy_response = requests.post(
                        send_url,
                        data={
                            'recipient': phone,
                            'sender_id': getattr(settings, 'PHILSMS_SENDER_ID', 'RAPEX'),
                            'type': 'plain',
                            'message': message,
                            'api_token': auth_token,
                        },
                        headers={
                            'Authorization': f'Bearer {auth_token}',
                            'Accept': 'application/json',
                        },
                        timeout=10,
                    )
                    legacy_response.raise_for_status()

                    legacy_payload = {}
                    try:
                        legacy_payload = legacy_response.json() if legacy_response.content else {}
                    except ValueError:
                        legacy_payload = {}

                    legacy_status = str(legacy_payload.get('status', '') or '').strip().lower() if isinstance(legacy_payload, dict) else ''
                    if legacy_status and legacy_status not in {'success', 'ok', 'queued'}:
                        logger.error(
                            "PhilSMS legacy payload rejected message for %s: status=%s message=%s",
                            phone,
                            legacy_status,
                            legacy_payload.get('message') if isinstance(legacy_payload, dict) else None,
                        )
                        return False

                    if isinstance(legacy_payload, dict) and 'unauthenticated' in str(legacy_payload.get('message', '') or '').strip().lower():
                        logger.error("PhilSMS legacy authentication failed for %s: %s", phone, legacy_payload.get('message'))
                        return False

                    logger.info(f"SMS sent to {phone} via PhilSMS (legacy payload)")
                    return True

            logger.info(f"SMS sent to {phone} via PhilSMS")
            return True
        except Exception as e:
            logger.error(f"Failed to send SMS to {phone} via PhilSMS: {e}")
            return False

    @staticmethod
    def _send_sms_via_semaphore(phone: str, message: str) -> bool:
        api_key = settings.SEMAPHORE_API_KEY
        if not api_key or api_key == 'your-semaphore-api-key':
            logger.warning(f"[DEV] Semaphore not configured — OTP for {phone}: {message}")
            return False

        try:
            response = requests.post(
                'https://api.semaphore.co/api/v4/messages',
                data={
                    'apikey': api_key,
                    'number': phone,
                    'message': message,
                    'sendername': settings.SEMAPHORE_SENDER_NAME,
                },
                timeout=10,
            )
            response.raise_for_status()
            logger.info(f"SMS sent to {phone} via Semaphore")
            return True
        except Exception as e:
            logger.error(f"Failed to send SMS to {phone} via Semaphore: {e}")
            return False

    @staticmethod
    def request_email_otp(email: str, purpose: str) -> dict:
        email_backend = str(getattr(settings, 'EMAIL_BACKEND', '') or '').strip()
        email_host_user = str(getattr(settings, 'EMAIL_HOST_USER', '') or '').strip()
        email_host_password = str(getattr(settings, 'EMAIL_HOST_PASSWORD', '') or '').strip()

        if (
            email_backend == 'django.core.mail.backends.smtp.EmailBackend'
            and (
                not email_host_user
                or not email_host_password
                or email_host_user == 'your-smtp-username'
                or email_host_password == 'your-smtp-password'
            )
        ):
            raise RapexAPIException(
                'Email OTP service is not configured. Please set valid SMTP credentials.',
                code='email_otp_not_configured',
                status_code=503,
            )

        otp_code = ''.join(random.choices(string.digits, k=6))
        email_expiry_seconds = int(getattr(settings, 'RAPEX_EMAIL_OTP_EXPIRY_SECONDS', 900) or 900)
        expires_at = timezone.now() + timedelta(seconds=email_expiry_seconds)
        otp_record = OTPRecord.objects.create(
            email=email.lower(),
            channel=OTPRecord.Channel.EMAIL,
            otp_code=otp_code,
            purpose=purpose,
            expires_at=expires_at,
        )

        subject, text_message, html_message = OTPService._build_email_otp_content(
            otp_code=otp_code,
            purpose=purpose,
            expiry_seconds=email_expiry_seconds,
        )
        try:
            email_message = EmailMultiAlternatives(
                subject=subject,
                body=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email],
            )
            email_message.attach_alternative(html_message, 'text/html')
            delivered_count = email_message.send(fail_silently=False)
            if delivered_count < 1:
                raise RapexAPIException(
                    'Email OTP could not be delivered. Please verify SMTP configuration.',
                    code='email_otp_delivery_failed',
                    status_code=503,
                )
        except RapexAPIException:
            otp_record.delete()
            raise
        except Exception as exc:
            otp_record.delete()
            logger.error(f"Failed to send email OTP to {email}: {exc}")
            raise RapexAPIException(
                'Email OTP delivery failed. Please check SMTP credentials and sender settings.',
                code='email_otp_delivery_failed',
                status_code=503,
            )

        return {
            'message': 'OTP sent successfully.',
            'expires_in': email_expiry_seconds,
        }

    @staticmethod
    def verify_email_otp(email: str, otp_code: str, purpose: str) -> bool:
        otp_record = OTPRecord.objects.filter(
            email=email.lower(),
            purpose=purpose,
            channel=OTPRecord.Channel.EMAIL,
            is_used=False,
        ).order_by('-created_at').first()

        if not otp_record:
            raise InvalidOTP()
        if otp_record.is_expired:
            raise OTPExpired()
        if otp_record.otp_code != otp_code:
            otp_record.attempt_count += 1
            otp_record.save(update_fields=['attempt_count'])
            raise InvalidOTP()

        otp_record.is_used = True
        otp_record.save(update_fields=['is_used'])
        return True


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
    def login(identifier: str, password: str, role: str | None = None) -> dict:
        """Authenticate with email or username plus password."""
        lookup = (identifier or '').strip().lower()
        if not lookup or not password:
            raise RapexAPIException(
                tr('auth.password.invalid'),
                code='invalid_credentials',
                status_code=401,
            )

        user = CustomUser.objects.filter(email__iexact=lookup).first()
        if not user:
            user = CustomUser.objects.filter(username__iexact=lookup).first()

        if not user or not user.has_usable_password() or not user.check_password(password):
            raise RapexAPIException(
                tr('auth.password.invalid'),
                code='invalid_credentials',
                status_code=401,
            )

        if role and user.role != role:
            raise RapexAPIException(
                tr('auth.google.role_conflict'),
                code='role_mismatch',
                status_code=403,
            )

        if not user.is_active:
            raise RapexAPIException(tr('auth.account.inactive'), code='account_inactive', status_code=403)

        return AuthService.login_by_user(user, message=tr('auth.password.login_success'))

    @staticmethod
    def login_by_user(user, message: str | None = None) -> dict:
        """Generate JWT tokens directly from a user object (used after registration)."""
        if not user.is_active:
            raise RapexAPIException(tr('auth.account.inactive'), code='account_inactive', status_code=403)

        refresh = RefreshToken.for_user(user)
        refresh['role'] = user.role
        refresh['email'] = user.email
        refresh['status'] = user.status
        refresh['wizard_completed'] = user.wizard_completed

        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        payload = {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': str(user.id),
                'email': user.email,
                'phone': user.phone,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'avatar_url': user.avatar_url,
                'profile_image_url': user.profile_image_url,
                'google_id': user.google_id,
                'role': user.role,
                'status': user.status,
                'wizard_completed': user.wizard_completed,
                'is_verified': user.is_verified,
            },
        }
        if message:
            payload['message'] = message
        return payload

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


class MagicLinkService:
    """Primary fallback authentication via email magic links."""

    @staticmethod
    def _build_link(redirect_url: str, token: str, email: str, role: str) -> str:
        parsed = urlparse(redirect_url)
        query = dict(parse_qsl(parsed.query, keep_blank_values=True))
        query.update({'token': token, 'email': email, 'role': role})
        return urlunparse(parsed._replace(query=urlencode(query)))

    @staticmethod
    def _default_redirect(role: str) -> str:
        defaults = {
            Roles.USER: 'http://localhost:3000/auth/callback',
            Roles.MERCHANT: 'http://localhost:3001/auth/callback',
            Roles.RIDER: 'http://localhost:3002/auth/callback',
            Roles.ADMIN: 'http://localhost:3003/auth/callback',
            Roles.SUPERADMIN: 'http://localhost:3004/auth/callback',
        }
        return defaults.get(role, defaults[Roles.USER])

    @staticmethod
    def _account_defaults(role: str) -> tuple[str, bool]:
        if role == Roles.MERCHANT:
            return CustomUser.AccountStatus.PENDING, False
        return CustomUser.AccountStatus.APPROVED, True

    @staticmethod
    def request_magic_link(email: str, role: str, redirect_url: str = '') -> dict:
        normalized_email = email.lower().strip()

        if CustomUser.objects.filter(email__iexact=normalized_email).exists():
            raise RapexAPIException(
                tr('auth.magic_link.signup_only'),
                code='magic_link_signup_only',
                status_code=409,
            )

        token = get_random_string(48)
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        OTPRecord.objects.create(
            email=normalized_email,
            channel=OTPRecord.Channel.EMAIL,
            purpose=OTPRecord.Purpose.MAGIC_LINK,
            otp_code='000000',
            token_hash=token_hash,
            expires_at=timezone.now() + timedelta(minutes=15),
            meta={'role': role},
        )

        target = redirect_url or MagicLinkService._default_redirect(role)
        magic_link = MagicLinkService._build_link(target, token, normalized_email, role)

        send_mail(
            'RAPEX sign in link',
            f'Use this secure sign in link: {magic_link}\n\nThis link expires in 15 minutes.',
            settings.DEFAULT_FROM_EMAIL,
            [normalized_email],
            fail_silently=bool(settings.DEBUG),
        )

        response = {'message': tr('auth.magic_link.sent')}
        if settings.DEBUG:
            response['debug_magic_link'] = magic_link
        return response

    @staticmethod
    @transaction.atomic
    def verify_magic_link(email: str, token: str, role: str | None = None) -> dict:
        normalized_email = email.lower().strip()
        record = OTPRecord.objects.filter(
            email=normalized_email,
            channel=OTPRecord.Channel.EMAIL,
            purpose=OTPRecord.Purpose.MAGIC_LINK,
            is_used=False,
        ).order_by('-created_at').first()

        if not record or record.is_expired:
            raise RapexAPIException(tr('auth.magic_link.invalid'), code='magic_link_invalid', status_code=401)

        expected_hash = hashlib.sha256(token.encode()).hexdigest()
        if record.token_hash != expected_hash:
            raise RapexAPIException(tr('auth.magic_link.invalid'), code='magic_link_invalid', status_code=401)

        requested_role = role or record.meta.get('role')
        if requested_role not in dict(Roles.CHOICES):
            raise RapexAPIException('Invalid role for magic link.', code='invalid_role', status_code=400)

        user = CustomUser.objects.filter(email=normalized_email).first()
        if user and user.role != requested_role:
            raise RapexAPIException(tr('auth.google.role_conflict'), code='role_mismatch', status_code=403)

        if not user:
            account_status, wizard_completed = MagicLinkService._account_defaults(requested_role)
            user = CustomUser.objects.create_user(
                phone=None,
                role=requested_role,
                email=normalized_email,
                is_verified=True,
                status=account_status,
                wizard_completed=wizard_completed,
            )
            user.set_unusable_password()
            user.save(update_fields=['password'])
            GoogleAuthService._ensure_profile(user, requested_role, normalized_email.split('@')[0], {})

        record.is_used = True
        record.save(update_fields=['is_used'])
        return AuthService.login_by_user(user, message=tr('auth.magic_link.login_success'))


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

        if google_data.get('picture') and user.profile_image_url != google_data['picture']:
            user.profile_image_url = google_data['picture']
            changed_fields.append('profile_image_url')

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

        if user.google_id != google_data['sub']:
            user.google_id = google_data['sub']
            user.save(update_fields=['google_id'])

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
                    'status': MerchantProfile.AccountStatus.PENDING,
                    'wizard_completed': False,
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

        requested_role = role
        if requested_role and requested_role not in dict(Roles.CHOICES):
            raise RapexAPIException('Invalid role.', code='invalid_role', status_code=400)

        user = social_account.user if social_account else None
        if not user:
            user = CustomUser.objects.filter(email=google_data['email']).first()

        if user and requested_role and user.role != requested_role:
            raise RapexAPIException(tr('auth.google.role_conflict'), code='role_mismatch', status_code=403)

        created = False
        if not user:
            if not requested_role:
                raise RapexAPIException(tr('auth.signup_required'), code='google_signup_required', status_code=404)

            account_status = CustomUser.AccountStatus.PENDING if requested_role == Roles.MERCHANT else CustomUser.AccountStatus.APPROVED
            wizard_completed = requested_role != Roles.MERCHANT
            user = CustomUser.objects.create_user(
                phone=None,
                role=requested_role,
                email=google_data['email'],
                is_verified=True,
                first_name=google_data.get('given_name', ''),
                last_name=google_data.get('family_name', ''),
                avatar_url=google_data.get('picture', ''),
                profile_image_url=google_data.get('picture', ''),
                google_id=google_data.get('sub'),
                status=account_status,
                wizard_completed=wizard_completed,
            )
            user.set_unusable_password()
            user.save(update_fields=['password'])
            GoogleAuthService._ensure_profile(
                user,
                requested_role,
                (google_data.get('full_name') or google_data['email']).strip(),
                {},
            )
            created = True

        GoogleAuthService._sync_user_identity_fields(user, google_data)
        GoogleAuthService._sync_social_account(user, google_data)
        return AuthService.login_by_user(
            user,
            message=tr('auth.google.account_created') if created else tr('auth.google.login_success'),
        )

    @staticmethod
    @transaction.atomic
    def signup(
        id_token: str,
        role: str,
        phone: str | None = None,
        otp_code: str | None = None,
        full_name: str = '',
        extra_data: dict | None = None,
    ) -> dict:
        # Backward-compatible endpoint: Google signup now delegates to Google login provisioning flow.
        return GoogleAuthService.login(id_token=id_token, role=role)
