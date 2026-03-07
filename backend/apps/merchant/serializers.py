"""RAPEX Merchant Module — Serializers"""
from rest_framework import serializers
from .models import MerchantStore, StoreSchedule, MerchantMarkupOverride


class StoreScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreSchedule
        fields = ['id', 'day_of_week', 'open_time', 'close_time', 'is_closed']
        read_only_fields = ['id']


class MerchantStoreSerializer(serializers.ModelSerializer):
    schedules = StoreScheduleSerializer(many=True, read_only=True)

    class Meta:
        model = MerchantStore
        fields = [
            'id', 'store_type', 'display_name', 'description',
            'logo_url', 'banner_url', 'is_open', 'is_visible',
            'is_accepting_delivery', 'is_accepting_pickup', 'tags',
            'schedules', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'is_open', 'created_at', 'updated_at']


class MerchantStoreCreateSerializer(serializers.Serializer):
    store_type = serializers.ChoiceField(choices=MerchantStore.StoreType.choices)
    display_name = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True)
    logo_url = serializers.CharField(max_length=500, required=False, allow_blank=True)
    banner_url = serializers.CharField(max_length=500, required=False, allow_blank=True)
    is_accepting_delivery = serializers.BooleanField(default=True)
    is_accepting_pickup = serializers.BooleanField(default=True)
    tags = serializers.ListField(child=serializers.CharField(), required=False, default=list)


class NearbyStoreSerializer(serializers.ModelSerializer):
    distance_km = serializers.FloatField(read_only=True)
    merchant_name = serializers.CharField(source='merchant.full_name', read_only=True)
    business_lat = serializers.DecimalField(
        source='merchant.business_lat', max_digits=10, decimal_places=8, read_only=True,
    )
    business_lng = serializers.DecimalField(
        source='merchant.business_lng', max_digits=11, decimal_places=8, read_only=True,
    )

    class Meta:
        model = MerchantStore
        fields = [
            'id', 'store_type', 'display_name', 'description',
            'logo_url', 'banner_url', 'is_open',
            'is_accepting_delivery', 'is_accepting_pickup', 'tags',
            'merchant_name', 'business_lat', 'business_lng', 'distance_km',
        ]


class MerchantMarkupOverrideSerializer(serializers.ModelSerializer):
    class Meta:
        model = MerchantMarkupOverride
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
