"""RAPEX Notifications Module — Serializers"""
from rest_framework import serializers
from .models import Notification, FCMToken


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'event_type', 'title', 'body', 'data_payload',
            'delivery_status', 'read_at', 'created_at',
        ]


class FCMTokenSerializer(serializers.Serializer):
    device_id = serializers.CharField(max_length=255)
    fcm_token = serializers.CharField()
