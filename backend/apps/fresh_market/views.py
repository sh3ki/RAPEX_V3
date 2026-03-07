"""RAPEX Fresh Market Module — Views"""
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsMerchant
from .models import FreshMarketCategory, FreshMarketProduct
from .serializers import FreshMarketCategorySerializer, FreshMarketProductSerializer


class FreshCategoryListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsMerchant]
    serializer_class = FreshMarketCategorySerializer

    def get_queryset(self):
        return FreshMarketCategory.objects.filter(store_id=self.kwargs['store_id'], is_deleted=False)

    def perform_create(self, serializer):
        serializer.save(store_id=self.kwargs['store_id'])


class FreshProductListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsMerchant]
    serializer_class = FreshMarketProductSerializer

    def get_queryset(self):
        return FreshMarketProduct.objects.filter(store_id=self.kwargs['store_id'], is_deleted=False)

    def perform_create(self, serializer):
        from apps.settings_module.services import SettingsService
        base_price = serializer.validated_data['base_price']
        markup_rate, _ = SettingsService.calculate_markup('FRESH_MARKET', base_price)
        serializer.save(store_id=self.kwargs['store_id'], markup_rate=markup_rate)


class FreshProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsMerchant]
    serializer_class = FreshMarketProductSerializer

    def get_queryset(self):
        return FreshMarketProduct.objects.filter(is_deleted=False)
