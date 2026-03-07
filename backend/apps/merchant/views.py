"""RAPEX Merchant Module — Views"""
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsMerchant, IsKYCApproved

from .models import MerchantStore
from .serializers import (
    MerchantStoreCreateSerializer,
    MerchantStoreSerializer,
    NearbyStoreSerializer,
)
from .services import MerchantService


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
