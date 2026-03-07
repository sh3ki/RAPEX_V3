from django.urls import path
from apps.wallet import views

urlpatterns = [
    path('', views.PointsSummaryView.as_view(), name='points-summary'),
    path('history/', views.PointsHistoryView.as_view(), name='points-history'),
]

