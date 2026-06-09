from django.urls import path
from .views import ChatThreadListView, ChatMessageListView, SendMessageView, ChatAttachmentUploadView

urlpatterns = [
    path('threads/', ChatThreadListView.as_view(), name='chat-thread-list'),
    path('threads/<uuid:thread_id>/messages/', ChatMessageListView.as_view(), name='chat-messages'),
    path('attachments/upload/', ChatAttachmentUploadView.as_view(), name='chat-attachment-upload'),
    path('messages/', SendMessageView.as_view(), name='send-message'),
]

