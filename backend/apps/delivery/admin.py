from django.contrib import admin
from .models import DeliveryFareConfig, RiderDeliverySession


@admin.register(DeliveryFareConfig)
class DeliveryFareConfigAdmin(admin.ModelAdmin):
    list_display = ['vehicle_type', 'base_fare', 'standard_addon', 'saver_addon', 'surcharge_per_km', 'is_active']


@admin.register(RiderDeliverySession)
class RiderDeliverySessionAdmin(admin.ModelAdmin):
    list_display = ['rider', 'order', 'started_at', 'delivered_at', 'total_distance_km']

