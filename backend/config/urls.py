"""
RAPEX — URL Configuration
"""
from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # ── Auth ────────────────────────────────────────
    path('api/v1/auth/', include('apps.accounts.urls')),

    # ── SuperAdmin ──────────────────────────────────
    path('api/v1/superadmin/', include('apps.superadmin.urls')),

    # ── Admin ───────────────────────────────────────
    path('api/v1/admin/', include('apps.admin_panel.urls')),

    # ── Merchant ────────────────────────────────────
    path('api/v1/merchant/', include('apps.merchant.urls')),
    path('api/v1/merchant/shop/', include('apps.shop.urls')),
    path('api/v1/merchant/fresh-market/', include('apps.fresh_market.urls')),
    path('api/v1/merchant/ready-to-eat/', include('apps.ready_to_eat.urls')),
    path('api/v1/merchant/preloved/', include('apps.preloved.urls')),

    # ── Merchant Orders ─────────────────────────────
    path('api/v1/merchant/orders/', include('apps.orders.urls.merchant_urls')),

    # ── Rider ───────────────────────────────────────
    path('api/v1/rider/', include('apps.rider.urls')),
    path('api/v1/rider/orders/', include('apps.orders.urls.rider_urls')),

    # ── User ────────────────────────────────────────
    path('api/v1/user/orders/', include('apps.orders.urls.user_urls')),
    path('api/v1/user/wallet/', include('apps.wallet.urls.user_urls')),
    path('api/v1/user/points/', include('apps.wallet.urls.points_urls')),
    path('api/v1/user/referral/', include('apps.referrals.urls.user_urls')),
    path('api/v1/user/merchants/', include('apps.merchant.urls_user')),

    # ── Delivery ────────────────────────────────────
    path('api/v1/delivery/', include('apps.delivery.urls')),

    # ── Chat ────────────────────────────────────────
    path('api/v1/chat/', include('apps.messaging.urls')),

    # ── Notifications ───────────────────────────────
    path('api/v1/notifications/', include('apps.notifications.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
