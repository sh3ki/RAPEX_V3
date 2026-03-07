from django.urls import path
from . import views

urlpatterns = [
    path('<uuid:store_id>/categories/', views.FreshCategoryListCreateView.as_view(), name='fresh-categories'),
    path('<uuid:store_id>/products/', views.FreshProductListCreateView.as_view(), name='fresh-products'),
    path('products/<uuid:pk>/', views.FreshProductDetailView.as_view(), name='fresh-product-detail'),
]

