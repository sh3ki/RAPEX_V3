"""RAPEX Fresh Market Module — Serializers"""
from rest_framework import serializers
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
            'base_price', 'markup_rate', 'final_price', 'images',
            'freshness_status', 'auto_reset_daily', 'merchant_notes',
            'is_available', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'final_price', 'created_at', 'updated_at']
