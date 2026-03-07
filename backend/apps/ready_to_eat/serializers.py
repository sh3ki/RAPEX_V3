"""RAPEX Ready-to-Eat Module — Serializers"""
from rest_framework import serializers
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
            'is_available', 'is_sold_out', 'variants', 'addons',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ReadyToEatStoreSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReadyToEatStoreSettings
        fields = ['store', 'default_prep_time_minutes']
