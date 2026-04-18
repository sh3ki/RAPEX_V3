from django.urls import path
from . import views

urlpatterns = [
    path('stores/', views.MerchantStoreListView.as_view(), name='merchant-store-list'),
    path('stores/create/', views.MerchantStoreCreateView.as_view(), name='merchant-store-create'),
    path('stores/<uuid:pk>/', views.MerchantStoreDetailView.as_view(), name='merchant-store-detail'),
    path('stores/<uuid:pk>/open/', views.StoreOpenView.as_view(), name='merchant-store-open'),
    path('stores/<uuid:pk>/close/', views.StoreCloseView.as_view(), name='merchant-store-close'),
    path('onboarding/state/', views.MerchantOnboardingStateView.as_view(), name='merchant-onboarding-state'),
    path('onboarding/categories/', views.MerchantOnboardingCategoriesView.as_view(), name='merchant-onboarding-categories'),
    path('onboarding/country-codes/', views.MerchantOnboardingCountryCodesView.as_view(), name='merchant-onboarding-country-codes'),
    path('onboarding/business-types/', views.MerchantOnboardingBusinessTypesView.as_view(), name='merchant-onboarding-business-types'),
    path('onboarding/step/profile/', views.MerchantOnboardingProfileStepView.as_view(), name='merchant-onboarding-step-profile'),
    path('onboarding/step/business/', views.MerchantOnboardingBusinessStepView.as_view(), name='merchant-onboarding-step-business'),
    path('onboarding/step/location/', views.MerchantOnboardingLocationStepView.as_view(), name='merchant-onboarding-step-location'),
    path('onboarding/upload-document/', views.MerchantOnboardingDocumentUploadView.as_view(), name='merchant-onboarding-upload-document'),
    path('onboarding/upload-profile-image/', views.MerchantOnboardingProfileImageUploadView.as_view(), name='merchant-onboarding-upload-profile-image'),
    path('onboarding/step/documents/', views.MerchantOnboardingDocumentsStepView.as_view(), name='merchant-onboarding-step-documents'),
    path('onboarding/send-otp/', views.MerchantOnboardingSendOtpView.as_view(), name='merchant-onboarding-send-otp'),
    path('onboarding/submit/', views.MerchantOnboardingSubmitView.as_view(), name='merchant-onboarding-submit'),
]

