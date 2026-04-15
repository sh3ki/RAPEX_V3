"""
RAPEX Accounts — URL Patterns
"""
from django.urls import path

from . import views

urlpatterns = [
    # OTP
    path('otp/request/', views.OTPRequestView.as_view(), name='otp-request'),
    path('otp/verify/', views.OTPVerifyView.as_view(), name='otp-verify'),

    # Registration
    path('register/user/', views.UserRegistrationView.as_view(), name='register-user'),
    path('register/merchant/', views.MerchantRegistrationView.as_view(), name='register-merchant'),
    path('register/rider/', views.RiderRegistrationView.as_view(), name='register-rider'),

    # Token / Login
    path('token/', views.LoginView.as_view(), name='token-login'),
    path('google/login/', views.GoogleLoginView.as_view(), name='google-login'),
    path('google/signup/', views.GoogleSignupView.as_view(), name='google-signup'),
    path('token/refresh/', views.TokenRefreshView.as_view(), name='token-refresh'),
    path('logout/', views.LogoutView.as_view(), name='logout'),

    # Profiles
    path('user/profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('merchant/profile/', views.MerchantProfileView.as_view(), name='merchant-profile'),
    path('rider/profile/', views.RiderProfileView.as_view(), name='rider-profile'),
    path('admin/profile/', views.AdminProfileView.as_view(), name='admin-profile'),
    path('superadmin/profile/', views.SuperAdminProfileView.as_view(), name='superadmin-profile'),

    # KYC Upload
    path('kyc/upload/', views.KYCUploadView.as_view(), name='kyc-upload'),
]
