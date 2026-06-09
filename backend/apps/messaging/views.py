"""RAPEX Messaging Module — Views"""
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.core.storage import resolve_storage_url, role_directory, save_upload

from .models import ChatThread, ChatMessage
from .serializers import (
    ChatThreadSerializer,
    ChatMessageSerializer,
    SendMessageSerializer,
    ChatAttachmentUploadSerializer,
)


class ChatThreadListView(generics.ListAPIView):
    """GET /api/v1/chat/threads/"""
    permission_classes = [IsAuthenticated]
    serializer_class = ChatThreadSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'SUPERADMIN']:
            return ChatThread.objects.filter(is_deleted=False)
        return ChatThread.objects.filter(
            participant_id=user.id, is_deleted=False,
        )


class ChatMessageListView(generics.ListAPIView):
    """GET /api/v1/chat/threads/{thread_id}/messages/"""
    permission_classes = [IsAuthenticated]
    serializer_class = ChatMessageSerializer

    def get_queryset(self):
        return ChatMessage.objects.filter(
            thread_id=self.kwargs['thread_id'], is_deleted=False,
        )


class SendMessageView(APIView):
    """POST /api/v1/chat/messages/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        # Get or create thread
        thread_id = d.get('thread_id')
        if thread_id:
            thread = ChatThread.objects.get(pk=thread_id)
        else:
            thread, _ = ChatThread.objects.get_or_create(
                participant_id=request.user.id,
                participant_role=request.user.role,
                defaults={'admin': None},
            )

        msg = ChatMessage.objects.create(
            thread=thread,
            sender_id=request.user.id,
            sender_role=request.user.role,
            message_type=d.get('message_type', 'TEXT'),
            body=d.get('body'),
            attachment_url=d.get('attachment_url'),
        )

        # Update thread
        thread.last_message_at = timezone.now()
        if request.user.role in ['ADMIN', 'SUPERADMIN']:
            thread.unread_count_participant += 1
        else:
            thread.unread_count_admin += 1
        thread.save(update_fields=['last_message_at', 'unread_count_admin', 'unread_count_participant', 'updated_at'])

        # Broadcast via WebSocket
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync

            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"chat_thread_{thread.id}",
                {
                    'type': 'chat_message',
                    'data': {
                        'id': str(msg.id),
                        'thread_id': str(thread.id),
                        'sender_role': msg.sender_role,
                        'body': msg.body,
                        'message_type': msg.message_type,
                        'timestamp': msg.created_at.isoformat(),
                    },
                },
            )
        except Exception:
            pass

        return Response(ChatMessageSerializer(msg, context={'request': request}).data, status=status.HTTP_201_CREATED)


class ChatAttachmentUploadView(APIView):
    """POST /api/v1/chat/attachments/upload/"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = ChatAttachmentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        thread = None
        thread_id = serializer.validated_data.get('thread_id')
        if thread_id:
            thread = ChatThread.objects.get(pk=thread_id, is_deleted=False)
            if request.user.role not in ['ADMIN', 'SUPERADMIN'] and thread.participant_id != request.user.id:
                raise PermissionDenied('You do not have access to this thread.')

        upload_file = serializer.validated_data['file']
        content_type = (getattr(upload_file, 'content_type', '') or '').lower()
        media_folder = 'images' if content_type.startswith('image/') else 'files'
        stored_path = save_upload(
            upload_file,
            'communications',
            'chat',
            'threads',
            str(thread.id) if thread else 'unassigned',
            'attachments',
            role_directory(request.user.role),
            str(request.user.id),
            media_folder,
            stem='attachment',
        )

        message_type = 'IMAGE' if content_type.startswith('image/') else 'FILE'

        return Response(
            {
                'thread_id': str(thread.id) if thread else None,
                'message_type': message_type,
                'file_url': resolve_storage_url(stored_path, request=request),
                'storage_path': stored_path,
            },
            status=status.HTTP_201_CREATED,
        )
