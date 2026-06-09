"""RAPEX Pre-Loved Module — Serializers"""
from rest_framework import serializers
from apps.core.storage import normalize_storage_path, resolve_storage_values
from .models import PrelovedCategory, PrelovedItem, PrelovedOffer


class PrelovedCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PrelovedCategory
        fields = ['id', 'name']
        read_only_fields = ['id']


class PrelovedItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrelovedItem
        fields = [
            'id', 'store', 'category', 'title', 'description', 'condition',
            'base_price', 'markup_rate', 'final_price', 'is_negotiable',
            'availability_status', 'stock_qty', 'delivery_available', 'images', 'approval_status',
            'created_at', 'updated_at',
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


class PrelovedOfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrelovedOffer
        fields = ['id', 'item', 'buyer', 'offered_price', 'status', 'message', 'created_at']
        read_only_fields = ['id', 'buyer', 'created_at']
