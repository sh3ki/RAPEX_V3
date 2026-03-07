"""RAPEX Rider Module — Views"""
from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsRider
from apps.wallet.models import RiderRemittanceRecord


class RiderOnlineToggleView(APIView):
    """PATCH /api/v1/rider/online/"""
    permission_classes = [IsAuthenticated, IsRider]

    def patch(self, request):
        profile = request.user.riderprofile
        profile.is_online = not profile.is_online
        profile.save(update_fields=['is_online', 'updated_at'])
        return Response({'is_online': profile.is_online})


class RiderLocationUpdateView(APIView):
    """POST /api/v1/rider/location/update/"""
    permission_classes = [IsAuthenticated, IsRider]

    def post(self, request):
        profile = request.user.riderprofile
        profile.current_lat = request.data['lat']
        profile.current_lng = request.data['lng']
        profile.save(update_fields=['current_lat', 'current_lng', 'updated_at'])

        # Broadcast to active order group
        from apps.orders.models import Order
        active_order = Order.objects.filter(
            rider=profile,
            status__in=['RIDER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'],
        ).first()

        if active_order:
            try:
                from channels.layers import get_channel_layer
                from asgiref.sync import async_to_sync

                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f"order_{active_order.id}",
                    {
                        'type': 'rider.location_update',
                        'lat': float(profile.current_lat),
                        'lng': float(profile.current_lng),
                    },
                )
            except Exception:
                pass

            # Record to GPS track
            from apps.delivery.models import RiderDeliverySession
            session = RiderDeliverySession.objects.filter(order=active_order).first()
            if session:
                from apps.delivery.services import DeliveryService
                DeliveryService.record_gps_point(
                    session, float(profile.current_lat), float(profile.current_lng),
                    timezone.now().isoformat(),
                )

        return Response({'status': 'ok'})


class RiderDashboardView(APIView):
    """GET /api/v1/rider/dashboard/"""
    permission_classes = [IsAuthenticated, IsRider]

    def get(self, request):
        from apps.orders.models import Order
        from apps.wallet.models import RapexWallet

        profile = request.user.riderprofile
        today = timezone.now().date()

        today_orders = Order.objects.filter(
            rider=profile, status='DELIVERED',
            delivered_at__date=today,
        )
        total_today = today_orders.count()
        earnings_today = today_orders.aggregate(
            total=Sum('delivery_fee')
        )['total'] or 0

        try:
            wallet = RapexWallet.objects.get(owner_id=request.user.id, owner_type='RIDER')
            balance = wallet.balance
        except RapexWallet.DoesNotExist:
            balance = 0

        return Response({
            'is_online': profile.is_online,
            'deliveries_today': total_today,
            'earnings_today': str(earnings_today),
            'wallet_balance': str(balance),
        })


class RiderRemittanceView(generics.ListAPIView):
    """GET /api/v1/rider/remittance/"""
    permission_classes = [IsAuthenticated, IsRider]

    def get(self, request, *args, **kwargs):
        records = RiderRemittanceRecord.objects.filter(
            rider__user=request.user, is_deleted=False,
        ).order_by('-period_start')[:20]
        data = [{
            'id': str(r.id),
            'period_start': r.period_start.isoformat(),
            'period_end': r.period_end.isoformat(),
            'amount_owed': str(r.amount_owed),
            'amount_paid': str(r.amount_paid),
            'status': r.status,
            'due_date': r.due_date.isoformat(),
        } for r in records]
        return Response(data)
