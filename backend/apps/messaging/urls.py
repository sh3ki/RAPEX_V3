from django.urls import path
from .views import ChatThreadListView, ChatMessageListView, SendMessageView

urlpatterns = [
    path('threads/', ChatThreadListView.as_view(), name='chat-thread-list'),
    path('threads/<uuid:thread_id>/messages/', ChatMessageListView.as_view(), name='chat-messages'),
    path('messages/', SendMessageView.as_view(), name='send-message'),
]

