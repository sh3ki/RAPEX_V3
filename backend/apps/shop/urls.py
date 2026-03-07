from django.urls import path
from . import views

urlpatterns = [
    path('<uuid:store_id>/categories/', views.ShopCategoryListCreateView.as_view(), name='shop-categories'),
    path('<uuid:store_id>/products/', views.ShopProductListView.as_view(), name='shop-products'),
    path('<uuid:store_id>/products/create/', views.ShopProductCreateView.as_view(), name='shop-product-create'),
    path('products/<uuid:pk>/', views.ShopProductDetailView.as_view(), name='shop-product-detail'),
]

