"""RAPEX Shop Module — Views"""
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsMerchant
from apps.merchant.models import MerchantStore

from .models import ShopCategory, ShopProduct
from .serializers import ShopCategorySerializer, ShopProductCreateSerializer, ShopProductSerializer
from apps.settings_module.services import SettingsService


class ShopCategoryListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsMerchant]
    serializer_class = ShopCategorySerializer

    def get_queryset(self):
        store_id = self.kwargs['store_id']
        return ShopCategory.objects.filter(store_id=store_id, is_deleted=False)

    def perform_create(self, serializer):
        serializer.save(store_id=self.kwargs['store_id'])


class ShopProductListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ShopProductSerializer

    def get_queryset(self):
        store_id = self.kwargs['store_id']
        return ShopProduct.objects.filter(store_id=store_id, is_deleted=False)


class ShopProductCreateView(APIView):
    permission_classes = [IsAuthenticated, IsMerchant]

    def post(self, request, store_id):
        serializer = ShopProductCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        store = MerchantStore.objects.get(pk=store_id, store_type='SHOP')
        markup_rate, _ = SettingsService.calculate_markup('SHOP', data['base_price'])

        product = ShopProduct.objects.create(
            store=store,
            category_id=data.get('category_id'),
            name=data['name'],
            description=data.get('description', ''),
            base_price=data['base_price'],
            markup_rate=markup_rate,
            images=data.get('images', []),
            has_inventory=data.get('has_inventory', False),
            stock_qty=data.get('stock_qty', 0),
        )
        return Response(ShopProductSerializer(product).data, status=status.HTTP_201_CREATED)


class ShopProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsMerchant]
    serializer_class = ShopProductSerializer

    def get_queryset(self):
        return ShopProduct.objects.filter(is_deleted=False)
