"""
RAPEX Settings Module — Serializers
"""
from rest_framework import serializers

from .models import CommissionTier, MarkupTier, PlatformSetting


class PlatformSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSetting
        fields = ['key', 'value', 'value_type', 'description', 'updated_at']
        read_only_fields = ['updated_at']


class PlatformSettingBulkUpdateSerializer(serializers.Serializer):
    settings = serializers.DictField(child=serializers.CharField())


class MarkupTierSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarkupTier
        fields = ['id', 'store_type', 'price_min', 'price_max', 'markup_rate']


class CommissionTierSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommissionTier
        fields = ['id', 'store_type', 'price_min', 'price_max', 'commission_rate']
