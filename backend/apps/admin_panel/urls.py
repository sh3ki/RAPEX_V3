from django.urls import path
from .views import (
    AdminDashboardView,
    AdminUserListView, AdminUserDetailView, AdminUserKYCApproveView, AdminUserKYCRejectView,
    AdminMerchantListView, AdminMerchantDetailView, AdminMerchantKYCApproveView, AdminMerchantKYCRejectView,
    AdminRiderListView, AdminRiderKYCApproveView, AdminRiderKYCRejectView,
    AdminRiderWalletLoadView, AdminRiderIncentiveConfirmView,
    AdminReportDailyView, AdminReportWeeklyView, AdminReportByStoreTypeView,
    AdminNotificationLogView, AdminNotificationBroadcastView,
    AdminFraudFlagListView, AdminFraudCaseListView, AdminFraudCaseCreateView,
    AdminFraudBlacklistView,
    AdminReferralUserListView, AdminReferralRiderListView,
)

urlpatterns = [
    # Dashboard
    path('dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),

    # Users
    path('users/', AdminUserListView.as_view(), name='admin-user-list'),
    path('users/<uuid:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('users/<uuid:pk>/approve/', AdminUserKYCApproveView.as_view(), name='admin-user-approve'),
    path('users/<uuid:pk>/reject/', AdminUserKYCRejectView.as_view(), name='admin-user-reject'),

    # Merchants
    path('merchants/', AdminMerchantListView.as_view(), name='admin-merchant-list'),
    path('merchants/<uuid:pk>/details/', AdminMerchantDetailView.as_view(), name='admin-merchant-detail'),
    path('merchants/<uuid:pk>/approve/', AdminMerchantKYCApproveView.as_view(), name='admin-merchant-approve'),
    path('merchants/<uuid:pk>/reject/', AdminMerchantKYCRejectView.as_view(), name='admin-merchant-reject'),

    # Riders
    path('riders/', AdminRiderListView.as_view(), name='admin-rider-list'),
    path('riders/<uuid:pk>/approve/', AdminRiderKYCApproveView.as_view(), name='admin-rider-approve'),
    path('riders/<uuid:pk>/reject/', AdminRiderKYCRejectView.as_view(), name='admin-rider-reject'),
    path('riders/<uuid:pk>/wallet/load/', AdminRiderWalletLoadView.as_view(), name='admin-rider-wallet-load'),
    path('riders/<uuid:pk>/incentive/confirm/', AdminRiderIncentiveConfirmView.as_view(), name='admin-rider-incentive'),

    # Reports
    path('reports/daily/', AdminReportDailyView.as_view(), name='admin-report-daily'),
    path('reports/weekly/', AdminReportWeeklyView.as_view(), name='admin-report-weekly'),
    path('reports/by-store-type/', AdminReportByStoreTypeView.as_view(), name='admin-report-store-type'),

    # Notifications
    path('notifications/log/', AdminNotificationLogView.as_view(), name='admin-notification-log'),
    path('notifications/broadcast/', AdminNotificationBroadcastView.as_view(), name='admin-notification-broadcast'),

    # Fraud
    path('fraud/flags/', AdminFraudFlagListView.as_view(), name='admin-fraud-flags'),
    path('fraud/cases/', AdminFraudCaseListView.as_view(), name='admin-fraud-cases'),
    path('fraud/cases/create/', AdminFraudCaseCreateView.as_view(), name='admin-fraud-case-create'),
    path('fraud/blacklist/', AdminFraudBlacklistView.as_view(), name='admin-fraud-blacklist'),

    # Referrals
    path('referrals/users/', AdminReferralUserListView.as_view(), name='admin-referral-users'),
    path('referrals/riders/', AdminReferralRiderListView.as_view(), name='admin-referral-riders'),
]

