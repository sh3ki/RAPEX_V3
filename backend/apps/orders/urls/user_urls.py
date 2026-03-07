from django.urls import path
from apps.orders.views import (
    PlaceOrderView, UserOrderListView, UserOrderDetailView, UserCancelOrderView,
)

urlpatterns = [
    path('', PlaceOrderView.as_view(), name='user-place-order'),
    path('list/', UserOrderListView.as_view(), name='user-order-list'),
    path('<uuid:pk>/', UserOrderDetailView.as_view(), name='user-order-detail'),
    path('<uuid:pk>/cancel/', UserCancelOrderView.as_view(), name='user-cancel-order'),
]

