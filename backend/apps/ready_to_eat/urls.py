from django.urls import path
from . import views

urlpatterns = [
    path('<uuid:store_id>/categories/', views.MenuCategoryListCreateView.as_view(), name='rte-categories'),
    path('<uuid:store_id>/items/', views.MenuItemListCreateView.as_view(), name='rte-items'),
    path('items/<uuid:pk>/', views.MenuItemDetailView.as_view(), name='rte-item-detail'),
    path('items/<uuid:item_id>/variants/', views.MenuItemVariantListCreateView.as_view(), name='rte-variants'),
    path('items/<uuid:item_id>/addons/', views.MenuItemAddonListCreateView.as_view(), name='rte-addons'),
]

