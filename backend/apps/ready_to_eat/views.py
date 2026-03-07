"""RAPEX Ready-to-Eat Module — Views"""
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsMerchant
from .models import MenuCategory, MenuItem, MenuItemVariant, MenuItemAddon
from .serializers import (
    MenuCategorySerializer, MenuItemSerializer,
    MenuItemVariantSerializer, MenuItemAddonSerializer,
)


class MenuCategoryListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsMerchant]
    serializer_class = MenuCategorySerializer

    def get_queryset(self):
        return MenuCategory.objects.filter(store_id=self.kwargs['store_id'], is_deleted=False)

    def perform_create(self, serializer):
        serializer.save(store_id=self.kwargs['store_id'])


class MenuItemListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsMerchant]
    serializer_class = MenuItemSerializer

    def get_queryset(self):
        return MenuItem.objects.filter(store_id=self.kwargs['store_id'], is_deleted=False)

    def perform_create(self, serializer):
        serializer.save(store_id=self.kwargs['store_id'])


class MenuItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsMerchant]
    serializer_class = MenuItemSerializer
    queryset = MenuItem.objects.filter(is_deleted=False)


class MenuItemVariantListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsMerchant]
    serializer_class = MenuItemVariantSerializer

    def get_queryset(self):
        return MenuItemVariant.objects.filter(menu_item_id=self.kwargs['item_id'], is_deleted=False)

    def perform_create(self, serializer):
        from apps.settings_module.services import SettingsService
        base_price = serializer.validated_data['base_price']
        markup_rate, _ = SettingsService.calculate_markup('READY_TO_EAT', base_price)
        serializer.save(menu_item_id=self.kwargs['item_id'], markup_rate=markup_rate)


class MenuItemAddonListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsMerchant]
    serializer_class = MenuItemAddonSerializer

    def get_queryset(self):
        return MenuItemAddon.objects.filter(menu_item_id=self.kwargs['item_id'], is_deleted=False)

    def perform_create(self, serializer):
        serializer.save(menu_item_id=self.kwargs['item_id'])
