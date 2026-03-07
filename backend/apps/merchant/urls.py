from django.urls import path
from . import views

urlpatterns = [
    path('stores/', views.MerchantStoreListView.as_view(), name='merchant-store-list'),
    path('stores/create/', views.MerchantStoreCreateView.as_view(), name='merchant-store-create'),
    path('stores/<uuid:pk>/', views.MerchantStoreDetailView.as_view(), name='merchant-store-detail'),
    path('stores/<uuid:pk>/open/', views.StoreOpenView.as_view(), name='merchant-store-open'),
    path('stores/<uuid:pk>/close/', views.StoreCloseView.as_view(), name='merchant-store-close'),
]

