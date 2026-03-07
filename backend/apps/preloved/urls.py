from django.urls import path
from . import views

urlpatterns = [
    path('<uuid:store_id>/categories/', views.PrelovedCategoryListCreateView.as_view(), name='preloved-categories'),
    path('<uuid:store_id>/items/', views.PrelovedItemListCreateView.as_view(), name='preloved-items'),
    path('items/<uuid:pk>/', views.PrelovedItemDetailView.as_view(), name='preloved-item-detail'),
    path('items/<uuid:pk>/offer/', views.PrelovedOfferCreateView.as_view(), name='preloved-offer'),
]

