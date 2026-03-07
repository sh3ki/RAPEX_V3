"""RAPEX Delivery Module — Models"""
import uuid
from django.db import models
from apps.core.models import BaseModel


class DeliveryFareConfig(BaseModel):
    """Per-vehicle-type fare configuration."""
    VEHICLE_CHOICES = [
        ('BICYCLE', 'Bicycle'),
        ('MOTORCYCLE', 'Motorcycle'),
        ('4_WHEELS', '4 Wheels'),
    ]
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_CHOICES, unique=True)
    base_fare = models.DecimalField(max_digits=10, decimal_places=2)
    standard_addon = models.DecimalField(max_digits=10, decimal_places=2, default=15)
    saver_addon = models.DecimalField(max_digits=10, decimal_places=2, default=5)
    surcharge_per_km = models.DecimalField(max_digits=10, decimal_places=2, default=10)
    base_coverage_km = models.DecimalField(max_digits=5, decimal_places=2, default=3)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'delivery_fare_config'

    def __str__(self):
        return f"{self.vehicle_type} — base ₱{self.base_fare}"


class RiderDeliverySession(BaseModel):
    """GPS tracking session per delivery."""
    rider = models.ForeignKey(
        'accounts.RiderProfile', on_delete=models.CASCADE,
        related_name='delivery_sessions',
    )
    order = models.OneToOneField(
        'orders.Order', on_delete=models.CASCADE,
        related_name='delivery_session',
    )
    started_at = models.DateTimeField(auto_now_add=True)
    pickup_confirmed_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    total_distance_km = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    gps_track = models.JSONField(default=list, blank=True, help_text='[{lat, lng, ts}, ...]')

    class Meta:
        db_table = 'rider_delivery_sessions'

    def __str__(self):
        return f"Session {self.id} — Rider {self.rider_id}"

