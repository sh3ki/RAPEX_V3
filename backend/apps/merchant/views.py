"""RAPEX Merchant Module — Views"""
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsMerchant, IsKYCApproved
from apps.core.storage import normalize_storage_path, resolve_storage_url

from .models import MerchantStore
from .serializers import (
    MerchantStoreCreateSerializer,
    MerchantStoreSerializer,
    NearbyStoreSerializer,
    MerchantBusinessCategorySerializer,
    MerchantBusinessTypeSerializer,
    MerchantCountryCodeSerializer,
    MerchantOnboardingProfileStepSerializer,
    MerchantOnboardingBusinessStepSerializer,
    MerchantOnboardingLocationStepSerializer,
    MerchantOnboardingDocumentUploadSerializer,
    MerchantOnboardingProfileImageUploadSerializer,
    MerchantStoreAssetUploadSerializer,
    MerchantProductImageUploadSerializer,
    MerchantOnboardingDocumentsStepSerializer,
    MerchantOnboardingVerificationStepSerializer,
    MerchantOnboardingSendOtpSerializer,
    MerchantOnboardingVerifyOtpSerializer,
    MerchantOnboardingStateSerializer,
    MerchantBusinessProfileSerializer,
    MerchantLocationSerializer,
    MerchantDocumentSerializer,
)
from .services import MerchantService
from .models import (
    MerchantBusinessCategory,
    MerchantBusinessType,
    MerchantCountryCode,
    MerchantBusinessProfile,
    MerchantLocation,
    MerchantDocument,
)


class MerchantStoreListView(generics.ListAPIView):
    """GET /api/v1/merchant/stores/ — own stores."""
    permission_classes = [IsAuthenticated, IsMerchant]
    serializer_class = MerchantStoreSerializer

    def get_queryset(self):
        return MerchantStore.objects.filter(
            merchant=self.request.user.merchantprofile,
            is_deleted=False,
        ).select_related(
            'merchant__user',
            'merchant__business_profile',
        ).prefetch_related(
            'merchant__business_profile__categories',
            'merchant__business_profile__business_types',
        )


class MerchantStoreCreateView(APIView):
    """POST /api/v1/merchant/stores/"""
    permission_classes = [IsAuthenticated, IsMerchant, IsKYCApproved]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = MerchantStoreCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        profile_image = data.pop('profile_image')
        store_type = data.pop('store_type')
        store = MerchantService.create_store(
            merchant=request.user.merchantprofile,
            store_type=store_type,
            data=data,
        )

        MerchantService.upload_store_asset(
            store=store,
            upload_file=profile_image,
            asset_type='logo',
        )

        store.refresh_from_db()
        return Response(
            MerchantStoreSerializer(store, context={'request': request}).data,
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
        ).select_related(
            'merchant__user',
            'merchant__business_profile',
        ).prefetch_related(
            'merchant__business_profile__categories',
            'merchant__business_profile__business_types',
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


class MerchantStoreAssetUploadView(APIView):
    """POST /api/v1/merchant/stores/{id}/upload-asset/"""
    permission_classes = [IsAuthenticated, IsMerchant, IsKYCApproved]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        store = MerchantStore.objects.get(
            pk=pk,
            merchant=request.user.merchantprofile,
            is_deleted=False,
        )

        serializer = MerchantStoreAssetUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        stored_path = MerchantService.upload_store_asset(
            store=store,
            upload_file=serializer.validated_data['file'],
            asset_type=serializer.validated_data['asset_type'],
        )

        return Response(
            {
                'asset_type': serializer.validated_data['asset_type'],
                'file_url': resolve_storage_url(stored_path, request=request),
                'storage_path': stored_path,
            },
            status=status.HTTP_201_CREATED,
        )


class MerchantProductImageUploadView(APIView):
    """POST /api/v1/merchant/stores/{id}/upload-product-image/"""
    permission_classes = [IsAuthenticated, IsMerchant, IsKYCApproved]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        store = MerchantStore.objects.get(
            pk=pk,
            merchant=request.user.merchantprofile,
            is_deleted=False,
        )

        serializer = MerchantProductImageUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        stored_path = MerchantService.upload_product_image(
            store=store,
            upload_file=serializer.validated_data['file'],
        )

        return Response(
            {
                'file_url': resolve_storage_url(stored_path, request=request),
                'storage_path': stored_path,
            },
            status=status.HTTP_201_CREATED,
        )


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


class MerchantOnboardingCountryCodesView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsMerchant]
    serializer_class = MerchantCountryCodeSerializer

    def get_queryset(self):
        return MerchantCountryCode.objects.filter(is_active=True, is_deleted=False)


class MerchantOnboardingStateView(APIView):
    permission_classes = [IsAuthenticated, IsMerchant]

    def get(self, request):
        merchant_profile = request.user.merchantprofile
        state = MerchantService.get_or_create_onboarding_state(merchant_profile)
        business_profile = MerchantBusinessProfile.objects.filter(merchant=merchant_profile).first()
        location = MerchantLocation.objects.filter(merchant=merchant_profile).first()
        documents = MerchantDocument.objects.filter(merchant=merchant_profile, is_deleted=False)
        profile_image_url = resolve_storage_url(request.user.profile_image_url or request.user.avatar_url, request=request)

        document_payload = MerchantDocumentSerializer(documents, many=True, context={'request': request}).data
        for item in document_payload:
            stored_path = normalize_storage_path(item.get('file_url'))
            item['storage_path'] = stored_path
            item['file_url'] = resolve_storage_url(stored_path, request=request)

        return Response(
            {
                'state': MerchantOnboardingStateSerializer(state).data,
                'account': {
                    'status': request.user.status,
                    'wizard_completed': request.user.wizard_completed,
                    'kyc_status': merchant_profile.kyc_status,
                },
                'profile': {
                    'email': request.user.email,
                    'first_name': request.user.first_name,
                    'last_name': request.user.last_name,
                    'username': request.user.username,
                    'phone_number': request.user.phone,
                    'profile_image_url': profile_image_url,
                    'has_saved_password': request.user.has_usable_password(),
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
        serializer = MerchantOnboardingDocumentsStepSerializer(
            data=request.data,
            context={'merchant_profile': request.user.merchantprofile},
        )
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
        file_url = resolve_storage_url(stored_path, request=request)

        return Response(
            {
                'document_type': serializer.validated_data['document_type'],
                'file_url': file_url,
                'storage_path': stored_path,
            },
            status=status.HTTP_201_CREATED,
        )


class MerchantOnboardingProfileImageUploadView(APIView):
    permission_classes = [IsAuthenticated, IsMerchant]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = MerchantOnboardingProfileImageUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        stored_path = MerchantService.upload_profile_image(
            merchant_profile=request.user.merchantprofile,
            upload_file=serializer.validated_data['file'],
        )
        file_url = resolve_storage_url(stored_path, request=request)

        return Response(
            {
                'file_url': file_url,
                'storage_path': stored_path,
            },
            status=status.HTTP_201_CREATED,
        )


class MerchantOnboardingSendOtpView(APIView):
    permission_classes = [IsAuthenticated, IsMerchant]

    def post(self, request):
        serializer = MerchantOnboardingSendOtpSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        result = MerchantService.send_verification_otps(
            request.user.merchantprofile,
            channel=serializer.validated_data['channel'],
        )
        return Response(result, status=status.HTTP_200_OK)


class MerchantOnboardingVerifyOtpView(APIView):
    permission_classes = [IsAuthenticated, IsMerchant]

    def post(self, request):
        serializer = MerchantOnboardingVerifyOtpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        state = MerchantService.verify_verification_otp(
            request.user.merchantprofile,
            channel=data['channel'],
            otp_code=data['otp_code'],
        )
        return Response(MerchantOnboardingStateSerializer(state).data, status=status.HTTP_200_OK)


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
