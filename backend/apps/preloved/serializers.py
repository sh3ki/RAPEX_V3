"""RAPEX Pre-Loved Module — Serializers"""
from rest_framework import serializers
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
            'availability_status', 'delivery_available', 'images',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'final_price', 'created_at', 'updated_at']


class PrelovedOfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrelovedOffer
        fields = ['id', 'item', 'buyer', 'offered_price', 'status', 'message', 'created_at']
        read_only_fields = ['id', 'buyer', 'created_at']
