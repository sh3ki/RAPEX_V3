"""RAPEX Shop Module — Serializers"""
from rest_framework import serializers
from .models import ShopCategory, ShopProduct


class ShopCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopCategory
        fields = ['id', 'name', 'display_order']
        read_only_fields = ['id']


class ShopProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)

    class Meta:
        model = ShopProduct
        fields = [
            'id', 'store', 'category', 'category_name', 'name', 'description',
            'base_price', 'markup_rate', 'final_price', 'images',
            'has_inventory', 'stock_qty', 'is_available',
            'is_on_promo', 'promo_original_price',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'final_price', 'created_at', 'updated_at']


class ShopProductCreateSerializer(serializers.Serializer):
    category_id = serializers.UUIDField(required=False, allow_null=True)
    name = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True)
    base_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    images = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    has_inventory = serializers.BooleanField(default=False)
    stock_qty = serializers.IntegerField(default=0)
