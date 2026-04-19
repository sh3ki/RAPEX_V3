"""
RAPEX Accounts — Views
Auth endpoints: OTP, Registration, Login, Profile, KYC.
"""
import logging
import os
import uuid

from django.core.files.storage import default_storage
from django.utils.text import get_valid_filename
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsAdmin, IsMerchant, IsRider, IsSuperAdmin, IsUser

from .serializers import (
    GoogleLoginSerializer,
    GoogleSignupSerializer,
    KYCUploadSerializer,
    LoginSerializer,
    LogoutSerializer,
    MagicLinkRequestSerializer,
    MagicLinkVerifySerializer,
    MerchantProfileSerializer,
    MerchantRegistrationSerializer,
    OTPRequestSerializer,
    OTPVerifySerializer,
    RiderProfileSerializer,
    RiderRegistrationSerializer,
    SuperAdminProfileSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
    AdminProfileSerializer,
    UsernameAvailabilitySerializer,
)
from .services import AuthService, GoogleAuthService, MagicLinkService, OTPService
from .models import CustomUser

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════
# OTP ENDPOINTS
# ═══════════════════════════════════════════════════════════════════
class OTPRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'otp'

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = OTPService.request_otp(
            phone=serializer.validated_data['phone'],
            purpose=serializer.validated_data['purpose'],
        )
        return Response(result, status=status.HTTP_200_OK)


class OTPVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = OTPService.verify_otp(
            phone=serializer.validated_data['phone'],
            otp_code=serializer.validated_data['otp_code'],
            purpose=serializer.validated_data['purpose'],
        )
        return Response(result, status=status.HTTP_200_OK)


# ═══════════════════════════════════════════════════════════════════
# REGISTRATION ENDPOINTS
# ═══════════════════════════════════════════════════════════════════
class UserRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = AuthService.register_user(
            phone=data['phone'],
            password=data['password'],
            full_name=data['full_name'],
            birthday=data.get('birthday'),
            home_address=data.get('home_address', ''),
        )
        tokens = AuthService.login_by_user(user)
        return Response(tokens, status=status.HTTP_201_CREATED)


class MerchantRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = MerchantRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = AuthService.register_merchant(
            phone=data['phone'],
            password=data['password'],
            full_name=data['full_name'],
            birthday=data.get('birthday'),
            home_address=data.get('home_address', ''),
            business_name=data.get('business_name', ''),
            business_address=data.get('business_address', ''),
            business_lat=data.get('business_lat'),
            business_lng=data.get('business_lng'),
        )
        tokens = AuthService.login_by_user(user)
        return Response(tokens, status=status.HTTP_201_CREATED)


class RiderRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RiderRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = AuthService.register_rider(
            phone=data['phone'],
            password=data['password'],
            full_name=data['full_name'],
            birthday=data.get('birthday'),
            home_address=data.get('home_address', ''),
            emergency_contact_name=data.get('emergency_contact_name', ''),
            emergency_contact_phone=data.get('emergency_contact_phone', ''),
            vehicle_type=data.get('vehicle_type', 'MOTORCYCLE'),
            vehicle_plate=data.get('vehicle_plate'),
            vehicle_model=data.get('vehicle_model'),
        )
        tokens = AuthService.login_by_user(user)
        return Response(tokens, status=status.HTTP_201_CREATED)


# ═══════════════════════════════════════════════════════════════════
# TOKEN ENDPOINTS
# ═══════════════════════════════════════════════════════════════════
class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = AuthService.login(
            identifier=serializer.validated_data['identifier'],
            password=serializer.validated_data['password'],
            role=serializer.validated_data.get('role'),
        )
        return Response(result, status=status.HTTP_200_OK)


class MagicLinkRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = MagicLinkRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = MagicLinkService.request_magic_link(
            email=serializer.validated_data['email'],
            role=serializer.validated_data['role'],
            redirect_url=serializer.validated_data.get('redirect_url', ''),
        )
        return Response(result, status=status.HTTP_200_OK)


class MagicLinkVerifyView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = MagicLinkVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = MagicLinkService.verify_magic_link(
            email=serializer.validated_data['email'],
            token=serializer.validated_data['token'],
            role=serializer.validated_data.get('role'),
        )
        return Response(result, status=status.HTTP_200_OK)


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = GoogleLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = GoogleAuthService.login(
            id_token=serializer.validated_data['id_token'],
            role=serializer.validated_data.get('role'),
        )
        return Response(result, status=status.HTTP_200_OK)


class GoogleSignupView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = GoogleSignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        result = GoogleAuthService.signup(
            id_token=data['id_token'],
            role=data['role'],
            phone=data.get('phone'),
            otp_code=data.get('otp_code'),
            full_name=data.get('full_name', ''),
            extra_data={
                'business_name': data.get('business_name', ''),
                'admin_sub_role': data.get('admin_sub_role'),
            },
        )
        return Response(result, status=status.HTTP_201_CREATED)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = AuthService.logout(serializer.validated_data['refresh'])
        return Response(result, status=status.HTTP_200_OK)


class TokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from rest_framework_simplejwt.views import TokenRefreshView as JWTRefreshView
        view = JWTRefreshView.as_view()
        return view(request._request)


# ═══════════════════════════════════════════════════════════════════
# PROFILE ENDPOINTS
# ═══════════════════════════════════════════════════════════════════
class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsUser]
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user.userprofile


class MerchantProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsMerchant]
    serializer_class = MerchantProfileSerializer

    def get_object(self):
        return self.request.user.merchantprofile


class RiderProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsRider]
    serializer_class = RiderProfileSerializer

    def get_object(self):
        return self.request.user.riderprofile


class AdminProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = AdminProfileSerializer

    def get_object(self):
        return self.request.user.adminprofile


class SuperAdminProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    serializer_class = SuperAdminProfileSerializer

    def get_object(self):
        return self.request.user.superadminprofile


# ═══════════════════════════════════════════════════════════════════
# KYC UPLOAD
# ═══════════════════════════════════════════════════════════════════
class KYCUploadView(APIView):
    permission_classes = [IsAuthenticated]

    @staticmethod
    def _save_kyc_file(user, upload_file, tag: str) -> str:
        original_name = get_valid_filename(upload_file.name or tag)
        _, extension = os.path.splitext(original_name)
        extension = (extension or '').lower()

        path = f"kyc/{str(user.role).lower()}/{user.id}/{tag}-{uuid.uuid4().hex}{extension}"
        return default_storage.save(path, upload_file)

    def post(self, request):
        serializer = KYCUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        role = request.user.role
        if role == 'MERCHANT':
            profile = request.user.merchantprofile
        elif role == 'RIDER':
            profile = request.user.riderprofile
        elif role == 'USER':
            profile = request.user.userprofile
        else:
            return Response({'detail': 'KYC not applicable for this role.'}, status=400)

        # Save uploaded files
        data = serializer.validated_data
        generic_document = data.get('document')

        if 'kyc_id_photo' in data:
            profile.kyc_id_photo = self._save_kyc_file(request.user, data['kyc_id_photo'], 'id-photo')
        elif generic_document and hasattr(profile, 'kyc_id_photo'):
            profile.kyc_id_photo = self._save_kyc_file(request.user, generic_document, 'id-photo')

        if 'kyc_selfie_photo' in data:
            profile.kyc_selfie_photo = self._save_kyc_file(request.user, data['kyc_selfie_photo'], 'selfie-photo')
        if 'kyc_business_doc' in data and hasattr(profile, 'kyc_business_doc'):
            profile.kyc_business_doc = self._save_kyc_file(request.user, data['kyc_business_doc'], 'business-doc')
        if 'kyc_id_type' in data and hasattr(profile, 'kyc_id_type'):
            profile.kyc_id_type = data['kyc_id_type']

        profile.kyc_status = 'PENDING'
        profile.save()

        return Response({'message': 'KYC documents uploaded successfully.'}, status=status.HTTP_200_OK)


class UsernameAvailabilityView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = UsernameAvailabilitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data['username'].strip()
        available = not CustomUser.objects.filter(username=username).exclude(pk=request.user.pk).exists()
        return Response({'available': available}, status=status.HTTP_200_OK)
