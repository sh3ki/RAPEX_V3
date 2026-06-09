"""RAPEX Messaging Module — Serializers"""
from rest_framework import serializers
from apps.core.storage import normalize_storage_path, resolve_storage_url
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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        data['attachment_url'] = resolve_storage_url(data.get('attachment_url'), request=request)
        return data


class SendMessageSerializer(serializers.Serializer):
    thread_id = serializers.UUIDField(required=False)
    message_type = serializers.ChoiceField(
        choices=['TEXT', 'IMAGE', 'FILE', 'SYSTEM'], default='TEXT',
    )
    body = serializers.CharField(required=False, allow_blank=True)
    attachment_url = serializers.CharField(required=False, allow_blank=True)

    def validate_attachment_url(self, value):
        return normalize_storage_path(value)


class ChatAttachmentUploadSerializer(serializers.Serializer):
    thread_id = serializers.UUIDField(required=False, allow_null=True)
    file = serializers.FileField()

    def validate_file(self, value):
        max_size = 10 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError('File exceeds 10MB size limit.')

        allowed_content_types = {
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/pdf',
            'text/plain',
            'application/zip',
            'application/x-zip-compressed',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }
        content_type = (getattr(value, 'content_type', '') or '').lower()
        if content_type and content_type not in allowed_content_types:
            raise serializers.ValidationError('Unsupported file type for chat attachment.')

        return value
