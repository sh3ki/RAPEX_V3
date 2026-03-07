"""RAPEX Rider Module — Serializers"""
from rest_framework import serializers


class RiderLocationSerializer(serializers.Serializer):
    lat = serializers.DecimalField(max_digits=10, decimal_places=8)
    lng = serializers.DecimalField(max_digits=11, decimal_places=8)
