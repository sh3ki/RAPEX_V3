"""RAPEX Orders Module — Views"""
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsMerchant, IsRider, IsUser

from .models import Order
from .serializers import OrderSerializer, PlaceOrderSerializer
from .services import OrderService


# ═══════════════════════════════════════════════════════════════════
# USER ENDPOINTS
# ═══════════════════════════════════════════════════════════════════
class PlaceOrderView(APIView):
    """POST /api/v1/user/orders/"""
    permission_classes = [IsAuthenticated, IsUser]

    def post(self, request):
        serializer = PlaceOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = OrderService.place_order(request.user, serializer.validated_data)
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class UserOrderListView(generics.ListAPIView):
    """GET /api/v1/user/orders/"""
    permission_classes = [IsAuthenticated, IsUser]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user.userprofile, is_deleted=False)


class UserOrderDetailView(generics.RetrieveAPIView):
    """GET /api/v1/user/orders/{id}/"""
    permission_classes = [IsAuthenticated, IsUser]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user.userprofile, is_deleted=False)


class UserCancelOrderView(APIView):
    """POST /api/v1/user/orders/{id}/cancel/"""
    permission_classes = [IsAuthenticated, IsUser]

    def post(self, request, pk):
        order = Order.objects.get(pk=pk, user=request.user.userprofile)
        reason = request.data.get('reason', '')
        order = OrderService.cancel_order(order, request.user, reason)
        return Response(OrderSerializer(order).data)


# ═══════════════════════════════════════════════════════════════════
# MERCHANT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════
class MerchantOrderListView(generics.ListAPIView):
    """GET /api/v1/merchant/orders/"""
    permission_classes = [IsAuthenticated, IsMerchant]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(merchant=self.request.user.merchantprofile, is_deleted=False)


class MerchantAcceptOrderView(APIView):
    """PATCH /api/v1/merchant/orders/{id}/accept/"""
    permission_classes = [IsAuthenticated, IsMerchant]

    def patch(self, request, pk):
        order = Order.objects.get(pk=pk, merchant=request.user.merchantprofile)
        order = OrderService.accept_order(order, request.user)
        return Response(OrderSerializer(order).data)


class MerchantRejectOrderView(APIView):
    """PATCH /api/v1/merchant/orders/{id}/reject/"""
    permission_classes = [IsAuthenticated, IsMerchant]

    def patch(self, request, pk):
        order = Order.objects.get(pk=pk, merchant=request.user.merchantprofile)
        reason = request.data.get('reason', 'No reason given')
        order = OrderService.reject_order(order, request.user, reason)
        return Response(OrderSerializer(order).data)


class MerchantPickupConfirmedView(APIView):
    """PATCH /api/v1/merchant/orders/{id}/pickup-confirmed/"""
    permission_classes = [IsAuthenticated, IsMerchant]

    def patch(self, request, pk):
        order = Order.objects.get(pk=pk, merchant=request.user.merchantprofile)
        order = OrderService.pickup_confirmed(order, request.user)
        return Response(OrderSerializer(order).data)


# ═══════════════════════════════════════════════════════════════════
# RIDER ENDPOINTS
# ═══════════════════════════════════════════════════════════════════
class RiderActiveOrderView(APIView):
    """GET /api/v1/rider/orders/active/"""
    permission_classes = [IsAuthenticated, IsRider]

    def get(self, request):
        order = Order.objects.filter(
            rider=request.user.riderprofile,
            status__in=['RIDER_ASSIGNED', 'FOR_PICKUP', 'READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT'],
        ).first()
        if not order:
            return Response({'detail': 'No active order.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(OrderSerializer(order).data)


class RiderAcceptOrderView(APIView):
    """POST /api/v1/rider/orders/{id}/accept/"""
    permission_classes = [IsAuthenticated, IsRider]

    def post(self, request, pk):
        order = Order.objects.get(pk=pk)
        order = OrderService.assign_rider(order, request.user.riderprofile)
        return Response(OrderSerializer(order).data)


class RiderRejectOrderView(APIView):
    """POST /api/v1/rider/orders/{id}/reject/"""
    permission_classes = [IsAuthenticated, IsRider]

    def post(self, request, pk):
        return Response({'message': 'Ping rejected.'})


class RiderDeliverOrderView(APIView):
    """POST /api/v1/rider/orders/{id}/deliver/"""
    permission_classes = [IsAuthenticated, IsRider]

    def post(self, request, pk):
        order = Order.objects.get(pk=pk, rider=request.user.riderprofile)
        lat = float(request.data['lat'])
        lng = float(request.data['lng'])
        order = OrderService.mark_delivered(order, request.user, lat, lng)
        return Response(OrderSerializer(order).data)
