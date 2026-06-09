"""RAPEX Ready-to-Eat Module — Serializers"""
from rest_framework import serializers
from apps.core.storage import normalize_storage_path, resolve_storage_values
from .models import MenuCategory, MenuItem, MenuItemVariant, MenuItemAddon, ReadyToEatStoreSettings


class MenuItemAddonSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItemAddon
        fields = ['id', 'name', 'price', 'is_available']
        read_only_fields = ['id']


class MenuItemVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItemVariant
        fields = ['id', 'name', 'base_price', 'markup_rate', 'final_price', 'is_available']
        read_only_fields = ['id', 'final_price']


class MenuCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuCategory
        fields = ['id', 'name', 'display_order']
        read_only_fields = ['id']


class MenuItemSerializer(serializers.ModelSerializer):
    variants = MenuItemVariantSerializer(many=True, read_only=True)
    addons = MenuItemAddonSerializer(many=True, read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            'id', 'store', 'category', 'name', 'description', 'images',
            'is_available', 'is_sold_out', 'approval_status', 'variants', 'addons',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'approval_status', 'created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        data['images'] = resolve_storage_values(data.get('images') or [], request=request)
        return data

    def validate_images(self, value):
        normalized = [normalize_storage_path(item) for item in (value or []) if item]
        if len(normalized) < 3:
            raise serializers.ValidationError('At least 3 product images are required.')
        return normalized


class ReadyToEatStoreSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReadyToEatStoreSettings
        fields = ['store', 'default_prep_time_minutes']
