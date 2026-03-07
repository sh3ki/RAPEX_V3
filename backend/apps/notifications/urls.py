from django.urls import path
from .views import RegisterFCMTokenView, MarkNotificationReadView, UserNotificationsView

urlpatterns = [
    path('fcm-token/', RegisterFCMTokenView.as_view(), name='register-fcm-token'),
    path('<uuid:pk>/read/', MarkNotificationReadView.as_view(), name='mark-notification-read'),
    path('', UserNotificationsView.as_view(), name='user-notifications'),
]

