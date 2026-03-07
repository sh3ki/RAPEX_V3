from django.urls import path
from .views import FareEstimateView, RiderLocationView

urlpatterns = [
    path('fare-estimate/', FareEstimateView.as_view(), name='fare-estimate'),
    path('rider-location/<uuid:order_id>/', RiderLocationView.as_view(), name='rider-location'),
]

