"""RAPEX Delivery Module — Views"""
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsUser

from .serializers import FareEstimateSerializer
from .services import DeliveryService


class FareEstimateView(APIView):
    """POST /api/v1/delivery/fare-estimate/"""
    permission_classes = [IsAuthenticated, IsUser]

    def post(self, request):
        serializer = FareEstimateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data
        result = DeliveryService.estimate_fare(d['vehicle_type'], d['delivery_speed'], d['distance_km'])
        return Response(result)


class RiderLocationView(APIView):
    """GET /api/v1/delivery/rider-location/{order_id}/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        from apps.orders.models import Order
        order = Order.objects.get(pk=order_id, status__in=['IN_TRANSIT', 'PICKED_UP', 'RIDER_ASSIGNED'])
        if not order.rider:
            return Response({'detail': 'No rider assigned.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            'lat': str(order.rider.current_lat),
            'lng': str(order.rider.current_lng),
        })
