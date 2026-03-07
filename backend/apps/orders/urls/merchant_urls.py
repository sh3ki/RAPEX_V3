from django.urls import path
from apps.orders.views import (
    MerchantOrderListView, MerchantAcceptOrderView,
    MerchantRejectOrderView, MerchantPickupConfirmedView,
)

urlpatterns = [
    path('', MerchantOrderListView.as_view(), name='merchant-order-list'),
    path('<uuid:pk>/accept/', MerchantAcceptOrderView.as_view(), name='merchant-accept-order'),
    path('<uuid:pk>/reject/', MerchantRejectOrderView.as_view(), name='merchant-reject-order'),
    path('<uuid:pk>/pickup-confirmed/', MerchantPickupConfirmedView.as_view(), name='merchant-pickup-confirmed'),
]
