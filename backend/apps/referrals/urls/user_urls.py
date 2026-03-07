from django.urls import path
from apps.referrals.views import UserReferralView

urlpatterns = [
    path('', UserReferralView.as_view(), name='user-referral'),
]

