"""RAPEX Messaging Module — Serializers"""
from rest_framework import serializers
from .models import ChatThread, ChatMessage


class ChatThreadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatThread
        fields = [
            'id', 'admin', 'participant_id', 'participant_role',
            'is_archived', 'unread_count_admin', 'unread_count_participant',
            'last_message_at', 'created_at',
        ]


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = [
            'id', 'thread', 'sender_id', 'sender_role',
            'message_type', 'body', 'attachment_url',
            'is_verified', 'wallet_amount', 'read_at', 'created_at',
        ]


class SendMessageSerializer(serializers.Serializer):
    thread_id = serializers.UUIDField(required=False)
    message_type = serializers.ChoiceField(
        choices=['TEXT', 'IMAGE', 'FILE', 'SYSTEM'], default='TEXT',
    )
    body = serializers.CharField(required=False, allow_blank=True)
    attachment_url = serializers.CharField(required=False, allow_blank=True)
