from django.urls import path
from . import views

urlpatterns = [
    path('settings/', views.SettingsListView.as_view(), name='settings-list'),
    path('settings/update/', views.SettingsBulkUpdateView.as_view(), name='settings-bulk-update'),
    path('markup-tiers/', views.MarkupTierListView.as_view(), name='markup-tiers'),
    path('commission-tiers/', views.CommissionTierListView.as_view(), name='commission-tiers'),
]

