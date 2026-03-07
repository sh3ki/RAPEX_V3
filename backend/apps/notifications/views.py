"""RAPEX Notifications Module — Views"""
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FCMToken, Notification
from .serializers import FCMTokenSerializer, NotificationSerializer
from .services import NotificationService


class RegisterFCMTokenView(APIView):
    """POST /api/v1/notifications/fcm-token/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FCMTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        FCMToken.objects.update_or_create(
            owner_id=request.user.id,
            device_id=serializer.validated_data['device_id'],
            defaults={
                'owner_role': request.user.role,
                'fcm_token': serializer.validated_data['fcm_token'],
                'is_active': True,
            },
        )
        return Response({'status': 'registered'}, status=status.HTTP_201_CREATED)


class MarkNotificationReadView(APIView):
    """PATCH /api/v1/notifications/{id}/read/"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        NotificationService.mark_read(pk, request.user.id)
        return Response({'status': 'read'})


class UserNotificationsView(generics.ListAPIView):
    """GET /api/v1/notifications/"""
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(
            recipient_id=self.request.user.id, is_deleted=False,
        )
