from django.contrib import admin
from .models import ChatThread, ChatMessage


@admin.register(ChatThread)
class ChatThreadAdmin(admin.ModelAdmin):
    list_display = ['participant_role', 'participant_id', 'is_archived', 'last_message_at']
    list_filter = ['participant_role', 'is_archived']


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['thread', 'sender_role', 'message_type', 'is_verified', 'created_at']

