"""RAPEX Delivery Module — Serializers"""
from rest_framework import serializers


class FareEstimateSerializer(serializers.Serializer):
    vehicle_type = serializers.ChoiceField(choices=['BICYCLE', 'MOTORCYCLE', '4_WHEELS'])
    delivery_speed = serializers.ChoiceField(choices=['STANDARD', 'SAVER'])
    distance_km = serializers.FloatField(min_value=0)
