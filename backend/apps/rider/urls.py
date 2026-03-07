from django.urls import path
from .views import (
    RiderOnlineToggleView, RiderLocationUpdateView,
    RiderDashboardView, RiderRemittanceView,
)

urlpatterns = [
    path('online/', RiderOnlineToggleView.as_view(), name='rider-online-toggle'),
    path('location/update/', RiderLocationUpdateView.as_view(), name='rider-location-update'),
    path('dashboard/', RiderDashboardView.as_view(), name='rider-dashboard'),
    path('remittance/', RiderRemittanceView.as_view(), name='rider-remittance'),
]

