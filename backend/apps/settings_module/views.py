"""
RAPEX Settings Module — Views
"""
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsAdmin, IsAdminOrSuperAdmin, IsSuperAdmin

from .models import CommissionTier, MarkupTier, PlatformSetting
from .serializers import (
    CommissionTierSerializer,
    MarkupTierSerializer,
    PlatformSettingBulkUpdateSerializer,
    PlatformSettingSerializer,
)
from .services import SettingsService


class SettingsListView(APIView):
    """GET /api/v1/superadmin/settings/ or /api/v1/admin/settings/"""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def get(self, request):
        settings_list = SettingsService.get_all()
        return Response(settings_list)


class SettingsBulkUpdateView(APIView):
    """PATCH /api/v1/superadmin/settings/"""
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def patch(self, request):
        serializer = PlatformSettingBulkUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        SettingsService.bulk_update(
            serializer.validated_data['settings'],
            updated_by=request.user.id,
        )
        return Response({'message': 'Settings updated successfully.'})


class AdminSettingsBulkUpdateView(APIView):
    """PATCH /api/v1/admin/settings/ — limited keys only."""
    permission_classes = [IsAuthenticated, IsAdmin]

    ADMIN_EDITABLE_KEYS = {
        'LOYALTY_POINTS_PER_ORDER',
        'REFERRAL_POINTS_PER_REFERRAL',
        'REFERRAL_MONTHLY_CAP',
        'RIDER_SEARCH_RADIUS_KM',
    }

    def patch(self, request):
        serializer = PlatformSettingBulkUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updates = serializer.validated_data['settings']

        # Filter to only admin-editable keys
        forbidden = set(updates.keys()) - self.ADMIN_EDITABLE_KEYS
        if forbidden:
            return Response(
                {'detail': f'Cannot edit: {", ".join(forbidden)}'},
                status=status.HTTP_403_FORBIDDEN,
            )

        SettingsService.bulk_update(updates, updated_by=request.user.id)
        return Response({'message': 'Settings updated successfully.'})


class MarkupTierListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    serializer_class = MarkupTierSerializer
    queryset = MarkupTier.objects.all()


class CommissionTierListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    serializer_class = CommissionTierSerializer
    queryset = CommissionTier.objects.all()
