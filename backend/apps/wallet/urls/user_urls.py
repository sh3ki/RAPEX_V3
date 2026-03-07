from django.urls import path
from apps.wallet import views

urlpatterns = [
    path('', views.UserWalletView.as_view(), name='user-wallet'),
]

