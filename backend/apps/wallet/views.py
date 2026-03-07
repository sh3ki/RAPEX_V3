"""RAPEX Wallet Module — Views"""
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsRider, IsUser

from .models import PointsTransaction, RapexWallet, UserLoyaltyPoints, WalletTransaction
from .serializers import (
    PointsTransactionSerializer,
    RapexWalletSerializer,
    UserLoyaltyPointsSerializer,
    WalletTransactionSerializer,
)


# ═══════════════════════════════════════════════════════════════════
# RIDER WALLET VIEWS
# ═══════════════════════════════════════════════════════════════════
class RiderWalletView(APIView):
    """GET /api/v1/rider/wallet/ — balance + recent transactions."""
    permission_classes = [IsAuthenticated, IsRider]

    def get(self, request):
        try:
            wallet = RapexWallet.objects.get(
                owner_id=request.user.id, owner_type='RIDER',
            )
        except RapexWallet.DoesNotExist:
            return Response({'balance': '0.00', 'recent_transactions': []})

        recent = WalletTransaction.objects.filter(wallet=wallet)[:10]
        return Response({
            'balance': str(wallet.balance),
            'recent_transactions': WalletTransactionSerializer(recent, many=True).data,
        })


class RiderWalletTransactionsView(generics.ListAPIView):
    """GET /api/v1/rider/wallet/transactions/"""
    permission_classes = [IsAuthenticated, IsRider]
    serializer_class = WalletTransactionSerializer

    def get_queryset(self):
        return WalletTransaction.objects.filter(
            wallet__owner_id=self.request.user.id,
            wallet__owner_type='RIDER',
        )


# ═══════════════════════════════════════════════════════════════════
# USER WALLET VIEWS
# ═══════════════════════════════════════════════════════════════════
class UserWalletView(APIView):
    """GET /api/v1/user/wallet/"""
    permission_classes = [IsAuthenticated, IsUser]

    def get(self, request):
        try:
            wallet = RapexWallet.objects.get(
                owner_id=request.user.id, owner_type='USER',
            )
        except RapexWallet.DoesNotExist:
            return Response({'balance': '0.00', 'recent_transactions': []})

        recent = WalletTransaction.objects.filter(wallet=wallet)[:10]
        return Response({
            'balance': str(wallet.balance),
            'recent_transactions': WalletTransactionSerializer(recent, many=True).data,
        })


# ═══════════════════════════════════════════════════════════════════
# LOYALTY POINTS VIEWS
# ═══════════════════════════════════════════════════════════════════
class PointsSummaryView(APIView):
    """GET /api/v1/user/points/"""
    permission_classes = [IsAuthenticated, IsUser]

    def get(self, request):
        try:
            lp = UserLoyaltyPoints.objects.get(user=request.user)
            return Response(UserLoyaltyPointsSerializer(lp).data)
        except UserLoyaltyPoints.DoesNotExist:
            return Response({'total_points': 0, 'rollover_balance': '0.00', 'lifetime_earned': 0})


class PointsHistoryView(generics.ListAPIView):
    """GET /api/v1/user/points/history/"""
    permission_classes = [IsAuthenticated, IsUser]
    serializer_class = PointsTransactionSerializer

    def get_queryset(self):
        return PointsTransaction.objects.filter(user=self.request.user)
