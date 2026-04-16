"""RAPEX Merchant Module — Views"""
from django.core.files.storage import default_storage

from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsMerchant, IsKYCApproved

from .models import MerchantStore
from .serializers import (
    MerchantStoreCreateSerializer,
    MerchantStoreSerializer,
    NearbyStoreSerializer,
    MerchantBusinessCategorySerializer,
    MerchantBusinessTypeSerializer,
    MerchantOnboardingProfileStepSerializer,
    MerchantOnboardingBusinessStepSerializer,
    MerchantOnboardingLocationStepSerializer,
    MerchantOnboardingDocumentUploadSerializer,
    MerchantOnboardingDocumentsStepSerializer,
    MerchantOnboardingVerificationStepSerializer,
    MerchantOnboardingStateSerializer,
    MerchantBusinessProfileSerializer,
    MerchantLocationSerializer,
    MerchantDocumentSerializer,
)
from .services import MerchantService
from .models import MerchantBusinessCategory, MerchantBusinessType, MerchantBusinessProfile, MerchantLocation, MerchantDocument


class MerchantStoreListView(generics.ListAPIView):
    """GET /api/v1/merchant/stores/ — own stores."""
    permission_classes = [IsAuthenticated, IsMerchant]
    serializer_class = MerchantStoreSerializer

    def get_queryset(self):
        return MerchantStore.objects.filter(
            merchant=self.request.user.merchantprofile,
            is_deleted=False,
        )


class MerchantStoreCreateView(APIView):
    """POST /api/v1/merchant/stores/"""
    permission_classes = [IsAuthenticated, IsMerchant, IsKYCApproved]

    def post(self, request):
        serializer = MerchantStoreCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        store_type = data.pop('store_type')
        store = MerchantService.create_store(
            merchant=request.user.merchantprofile,
            store_type=store_type,
            data=data,
        )
        return Response(
            MerchantStoreSerializer(store).data,
            status=status.HTTP_201_CREATED,
        )


class MerchantStoreDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/v1/merchant/stores/{id}/"""
    permission_classes = [IsAuthenticated, IsMerchant]
    serializer_class = MerchantStoreSerializer

    def get_queryset(self):
        return MerchantStore.objects.filter(
            merchant=self.request.user.merchantprofile,
            is_deleted=False,
        )


class StoreOpenView(APIView):
    """PATCH /api/v1/merchant/stores/{id}/open/"""
    permission_classes = [IsAuthenticated, IsMerchant]

    def patch(self, request, pk):
        store = MerchantStore.objects.get(
            pk=pk, merchant=request.user.merchantprofile, is_deleted=False,
        )
        MerchantService.toggle_open(store, True)
        return Response({'message': 'Store opened.'})


class StoreCloseView(APIView):
    """PATCH /api/v1/merchant/stores/{id}/close/"""
    permission_classes = [IsAuthenticated, IsMerchant]

    def patch(self, request, pk):
        store = MerchantStore.objects.get(
            pk=pk, merchant=request.user.merchantprofile, is_deleted=False,
        )
        MerchantService.toggle_open(store, False)
        return Response({'message': 'Store closed.'})


# ── User-Facing ────────────────────────────────────
class NearbyStoresView(generics.ListAPIView):
    """GET /api/v1/user/merchants/?lat=X&lng=Y&type=SHOP"""
    permission_classes = [IsAuthenticated]
    serializer_class = NearbyStoreSerializer

    def get_queryset(self):
        lat = float(self.request.query_params.get('lat', 0))
        lng = float(self.request.query_params.get('lng', 0))
        store_type = self.request.query_params.get('type', None)
        radius = float(self.request.query_params.get('radius', 5.0))
        return MerchantService.get_nearby_stores(lat, lng, radius, store_type)


class MerchantOnboardingCategoriesView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsMerchant]
    serializer_class = MerchantBusinessCategorySerializer

    def get_queryset(self):
        return MerchantBusinessCategory.objects.filter(is_active=True, is_deleted=False)


class MerchantOnboardingBusinessTypesView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsMerchant]
    serializer_class = MerchantBusinessTypeSerializer

    def get_queryset(self):
        queryset = MerchantBusinessType.objects.filter(is_active=True, is_deleted=False, category__is_active=True)
        category_ids = self.request.query_params.getlist('category_id')
        if category_ids:
            queryset = queryset.filter(category_id__in=category_ids)
        return queryset


class MerchantOnboardingStateView(APIView):
    permission_classes = [IsAuthenticated, IsMerchant]

    def get(self, request):
        merchant_profile = request.user.merchantprofile
        state = MerchantService.get_or_create_onboarding_state(merchant_profile)
        business_profile = MerchantBusinessProfile.objects.filter(merchant=merchant_profile).first()
        location = MerchantLocation.objects.filter(merchant=merchant_profile).first()
        documents = MerchantDocument.objects.filter(merchant=merchant_profile, is_deleted=False)
        document_payload = MerchantDocumentSerializer(documents, many=True).data
        for item in document_payload:
            stored_path = item.get('file_url')
            item['storage_path'] = stored_path
            if not stored_path:
                continue

            if stored_path.startswith('http://') or stored_path.startswith('https://'):
                continue

            resolved_url = default_storage.url(stored_path)
            if resolved_url.startswith('/'):
                resolved_url = request.build_absolute_uri(resolved_url)
            item['file_url'] = resolved_url

        return Response(
            {
                'state': MerchantOnboardingStateSerializer(state).data,
                'profile': {
                    'email': request.user.email,
                    'first_name': request.user.first_name,
                    'last_name': request.user.last_name,
                    'username': request.user.username,
                    'phone_number': request.user.phone,
                    'profile_image_url': request.user.profile_image_url or request.user.avatar_url,
                },
                'business': MerchantBusinessProfileSerializer(business_profile).data if business_profile else None,
                'location': MerchantLocationSerializer(location).data if location else None,
                'documents': document_payload,
            },
            status=status.HTTP_200_OK,
        )


class MerchantOnboardingProfileStepView(APIView):
    permission_classes = [IsAuthenticated, IsMerchant]

    def post(self, request):
        serializer = MerchantOnboardingProfileStepSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        state = MerchantService.save_profile_step(request.user.merchantprofile, serializer.validated_data)
        return Response(MerchantOnboardingStateSerializer(state).data, status=status.HTTP_200_OK)


class MerchantOnboardingBusinessStepView(APIView):
    permission_classes = [IsAuthenticated, IsMerchant]

    def post(self, request):
        serializer = MerchantOnboardingBusinessStepSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        state = MerchantService.save_business_step(request.user.merchantprofile, serializer.validated_data)
        return Response(MerchantOnboardingStateSerializer(state).data, status=status.HTTP_200_OK)


class MerchantOnboardingLocationStepView(APIView):
    permission_classes = [IsAuthenticated, IsMerchant]

    def post(self, request):
        serializer = MerchantOnboardingLocationStepSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        state = MerchantService.save_location_step(request.user.merchantprofile, serializer.validated_data)
        return Response(MerchantOnboardingStateSerializer(state).data, status=status.HTTP_200_OK)


class MerchantOnboardingDocumentsStepView(APIView):
    permission_classes = [IsAuthenticated, IsMerchant]

    def post(self, request):
        serializer = MerchantOnboardingDocumentsStepSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        state = MerchantService.save_documents_step(request.user.merchantprofile, serializer.validated_data)
        return Response(MerchantOnboardingStateSerializer(state).data, status=status.HTTP_200_OK)


class MerchantOnboardingDocumentUploadView(APIView):
    permission_classes = [IsAuthenticated, IsMerchant]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = MerchantOnboardingDocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        stored_path = MerchantService.upload_onboarding_document(
            merchant_profile=request.user.merchantprofile,
            document_type=serializer.validated_data['document_type'],
            upload_file=serializer.validated_data['file'],
        )
        file_url = default_storage.url(stored_path)

        if file_url.startswith('/'):
            file_url = request.build_absolute_uri(file_url)

        return Response(
            {
                'document_type': serializer.validated_data['document_type'],
                'file_url': file_url,
                'storage_path': stored_path,
            },
            status=status.HTTP_201_CREATED,
        )


class MerchantOnboardingSendOtpView(APIView):
    permission_classes = [IsAuthenticated, IsMerchant]

    def post(self, request):
        result = MerchantService.send_verification_otps(request.user.merchantprofile)
        return Response(result, status=status.HTTP_200_OK)


class MerchantOnboardingSubmitView(APIView):
    permission_classes = [IsAuthenticated, IsMerchant]

    def post(self, request):
        serializer = MerchantOnboardingVerificationStepSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        state = MerchantService.submit_onboarding(
            request.user.merchantprofile,
            email_otp=data['email_otp'],
            phone_otp=data['phone_otp'],
            terms_accepted=data['terms_accepted'],
            privacy_accepted=data['privacy_accepted'],
        )
        return Response(MerchantOnboardingStateSerializer(state).data, status=status.HTTP_200_OK)
