"""RAPEX Orders Module — Serializers"""
from rest_framework import serializers
from .models import Order, OrderItem, OrderStatusHistory


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product_id', 'product_type', 'product_name',
            'unit_price', 'quantity', 'line_total', 'add_ons', 'special_note',
        ]
        read_only_fields = ['id', 'line_total']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'merchant', 'store', 'store_type',
            'rider', 'status', 'delivery_method', 'vehicle_type', 'delivery_speed',
            'delivery_address', 'delivery_lat', 'delivery_lng',
            'subtotal', 'delivery_fee', 'points_discount', 'total_amount',
            'markup_collected', 'commission_rate', 'platform_commission', 'rapex_fee',
            'merchant_accept_deadline', 'pickup_confirmed_at', 'delivered_at',
            'cancellation_reason', 'special_notes',
            'items', 'created_at', 'updated_at',
        ]
        read_only_fields = fields


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusHistory
        fields = ['from_status', 'to_status', 'changed_by_role', 'changed_at', 'note']


class PlaceOrderItemSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    product_type = serializers.ChoiceField(choices=['SHOP', 'FRESH', 'FOOD', 'PRELOVED'])
    product_name = serializers.CharField(max_length=300)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    quantity = serializers.DecimalField(max_digits=8, decimal_places=3, default=1)
    add_ons = serializers.JSONField(required=False, default=None)
    special_note = serializers.CharField(required=False, allow_blank=True)


class PlaceOrderSerializer(serializers.Serializer):
    store_id = serializers.UUIDField()
    delivery_method = serializers.ChoiceField(choices=['DELIVERY', 'PICKUP'], default='DELIVERY')
    vehicle_type = serializers.ChoiceField(choices=['BICYCLE', 'MOTORCYCLE', '4_WHEELS'], required=False)
    delivery_speed = serializers.ChoiceField(choices=['STANDARD', 'SAVER'], required=False)
    delivery_address = serializers.CharField(required=False, allow_blank=True)
    delivery_lat = serializers.DecimalField(max_digits=10, decimal_places=8, required=False)
    delivery_lng = serializers.DecimalField(max_digits=11, decimal_places=8, required=False)
    distance_km = serializers.FloatField(required=False, default=0)
    points_discount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)
    special_notes = serializers.CharField(required=False, allow_blank=True)
    items = PlaceOrderItemSerializer(many=True)
