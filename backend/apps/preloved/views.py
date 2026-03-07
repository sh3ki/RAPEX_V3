"""RAPEX Pre-Loved Module — Views"""
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsMerchant

from .models import PrelovedCategory, PrelovedItem, PrelovedOffer
from .serializers import PrelovedCategorySerializer, PrelovedItemSerializer, PrelovedOfferSerializer


class PrelovedCategoryListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsMerchant]
    serializer_class = PrelovedCategorySerializer

    def get_queryset(self):
        return PrelovedCategory.objects.filter(store_id=self.kwargs['store_id'], is_deleted=False)

    def perform_create(self, serializer):
        serializer.save(store_id=self.kwargs['store_id'])


class PrelovedItemListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsMerchant]
    serializer_class = PrelovedItemSerializer

    def get_queryset(self):
        return PrelovedItem.objects.filter(store_id=self.kwargs['store_id'], is_deleted=False)

    def perform_create(self, serializer):
        from apps.settings_module.services import SettingsService
        base_price = serializer.validated_data['base_price']
        markup_rate, _ = SettingsService.calculate_markup('PRELOVED', base_price)
        serializer.save(store_id=self.kwargs['store_id'], markup_rate=markup_rate)


class PrelovedItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsMerchant]
    serializer_class = PrelovedItemSerializer
    queryset = PrelovedItem.objects.filter(is_deleted=False)


class PrelovedOfferCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        item = PrelovedItem.objects.get(pk=pk, availability_status='AVAILABLE', is_deleted=False)
        if not item.is_negotiable:
            return Response({'detail': 'This item does not accept offers.'}, status=400)
        serializer = PrelovedOfferSerializer(data={**request.data, 'item': str(pk)})
        serializer.is_valid(raise_exception=True)
        serializer.save(buyer=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
