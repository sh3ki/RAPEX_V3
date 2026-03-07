from django.urls import path
from apps.orders.views import (
    RiderActiveOrderView, RiderAcceptOrderView,
    RiderRejectOrderView, RiderDeliverOrderView,
)

urlpatterns = [
    path('active/', RiderActiveOrderView.as_view(), name='rider-active-order'),
    path('<uuid:pk>/accept/', RiderAcceptOrderView.as_view(), name='rider-accept-order'),
    path('<uuid:pk>/reject/', RiderRejectOrderView.as_view(), name='rider-reject-order'),
    path('<uuid:pk>/deliver/', RiderDeliverOrderView.as_view(), name='rider-deliver-order'),
]
