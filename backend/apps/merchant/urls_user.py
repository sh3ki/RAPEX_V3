from django.urls import path
from . import views

urlpatterns = [
    path('', views.NearbyStoresView.as_view(), name='nearby-stores'),
]

