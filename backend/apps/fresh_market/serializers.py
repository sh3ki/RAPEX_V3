"""RAPEX Fresh Market Module — Serializers"""
from rest_framework import serializers
from apps.core.storage import normalize_storage_path, resolve_storage_values
from .models import FreshMarketCategory, FreshMarketProduct


class FreshMarketCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FreshMarketCategory
        fields = ['id', 'name', 'display_order']
        read_only_fields = ['id']


class FreshMarketProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = FreshMarketProduct
        fields = [
            'id', 'store', 'category', 'name', 'product_type', 'pricing_mode',
            'description', 'base_price', 'markup_rate', 'final_price', 'images',
            'freshness_status', 'auto_reset_daily', 'merchant_notes',
            'stock_qty', 'is_available', 'approval_status', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'final_price', 'approval_status', 'created_at', 'updated_at']

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
