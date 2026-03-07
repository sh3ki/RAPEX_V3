from django.urls import path
from .views import (
    SuperAdminDashboardView,
    SuperAdminAdminListView, SuperAdminAdminDetailView,
    SuperAdminSettingsView,
    SuperAdminWalletLedgerView, SuperAdminWalletAdjustView,
    SuperAdminBlacklistView, SuperAdminAuditLogView,
)

urlpatterns = [
    path('dashboard/', SuperAdminDashboardView.as_view(), name='superadmin-dashboard'),
    path('admins/', SuperAdminAdminListView.as_view(), name='superadmin-admin-list'),
    path('admins/<uuid:pk>/', SuperAdminAdminDetailView.as_view(), name='superadmin-admin-detail'),
    path('settings/', SuperAdminSettingsView.as_view(), name='superadmin-settings'),
    path('wallet-ledger/', SuperAdminWalletLedgerView.as_view(), name='superadmin-wallet-ledger'),
    path('wallet/adjust/', SuperAdminWalletAdjustView.as_view(), name='superadmin-wallet-adjust'),
    path('fraud/blacklist/', SuperAdminBlacklistView.as_view(), name='superadmin-blacklist'),
    path('audit-log/', SuperAdminAuditLogView.as_view(), name='superadmin-audit-log'),
]

