"""
RAPEX Settings Module — Services
SettingsService with Redis caching.
"""
import json
import logging
from decimal import Decimal

from django.conf import settings as django_settings
from django.core.cache import cache

from .models import CommissionTier, MarkupTier, PlatformSetting

logger = logging.getLogger(__name__)

CACHE_PREFIX = 'rapex_setting:'
CACHE_TTL = 300  # 5 minutes


class SettingsService:
    """Platform settings with Redis cache-through."""

    @staticmethod
    def get(key: str, default=None):
        """Read from Redis cache first, fallback to DB."""
        cache_key = f"{CACHE_PREFIX}{key}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        try:
            setting = PlatformSetting.objects.get(key=key)
            value = setting.get_typed_value()
            cache.set(cache_key, value, CACHE_TTL)
            return value
        except PlatformSetting.DoesNotExist:
            return default

    @staticmethod
    def set(key: str, value, updated_by=None):
        """Update DB and invalidate Redis cache."""
        setting, created = PlatformSetting.objects.get_or_create(
            key=key,
            defaults={'value': str(value), 'last_updated_by': updated_by},
        )
        if not created:
            setting.value = str(value)
            if updated_by:
                setting.last_updated_by = updated_by
            setting.save()

        # Invalidate cache
        cache_key = f"{CACHE_PREFIX}{key}"
        cache.delete(cache_key)
        logger.info(f"Setting updated: {key} = {value}")

    @staticmethod
    def bulk_update(updates: dict, updated_by=None):
        """Update multiple settings at once."""
        for key, value in updates.items():
            SettingsService.set(key, value, updated_by)

    @staticmethod
    def get_all() -> list:
        """Return all settings as list of dicts."""
        return list(PlatformSetting.objects.values(
            'key', 'value', 'value_type', 'description', 'updated_at',
        ))

    @staticmethod
    def calculate_markup(store_type: str, base_price: Decimal) -> tuple:
        """
        Look up markup tier and return (markup_rate, final_price).
        Falls back to 'ALL' store type if no specific tier found.
        """
        tier = MarkupTier.objects.filter(
            store_type=store_type,
            price_min__lte=base_price,
            price_max__gte=base_price,
        ).first()

        if not tier:
            # Fallback: check for max tier (price_max=NULL means unlimited)
            tier = MarkupTier.objects.filter(
                store_type=store_type,
                price_min__lte=base_price,
                price_max__isnull=True,
            ).first()

        if not tier:
            # Fallback to ALL
            tier = MarkupTier.objects.filter(
                store_type='ALL',
                price_min__lte=base_price,
                price_max__isnull=True,
            ).order_by('-price_min').first()

            if not tier:
                tier = MarkupTier.objects.filter(
                    store_type='ALL',
                    price_min__lte=base_price,
                    price_max__gte=base_price,
                ).first()

        if not tier:
            logger.warning(f"No markup tier found for {store_type} @ ₱{base_price}")
            return Decimal('0'), base_price

        markup_rate = tier.markup_rate / Decimal('100')
        final_price = base_price * (1 + markup_rate)
        return tier.markup_rate, final_price.quantize(Decimal('0.01'))

    @staticmethod
    def calculate_commission(store_type: str, markup_amount: Decimal) -> Decimal:
        """Calculate commission from markup amount."""
        tier = CommissionTier.objects.filter(
            store_type__in=[store_type, 'ALL'],
        ).order_by('store_type').first()

        if not tier:
            return Decimal('0')

        rate = tier.commission_rate / Decimal('100')
        return (markup_amount * rate).quantize(Decimal('0.01'))

    @staticmethod
    def calculate_delivery_fare(vehicle_type: str, delivery_speed: str, distance_km: float) -> Decimal:
        """
        Compute delivery fare based on vehicle, speed, and distance.
        fare = base_fare + speed_addon + max(0, (distance_km - base_coverage_km)) * surcharge_per_km
        """
        base_fare_key = f"RIDER_BASE_FARE_{vehicle_type}"
        base_fare = Decimal(str(SettingsService.get(base_fare_key, '40.00')))

        speed_addon_key = f"RIDER_{delivery_speed.upper()}_ADDON"
        speed_addon = Decimal(str(SettingsService.get(speed_addon_key, '0')))

        surcharge_per_km = Decimal(str(SettingsService.get('RIDER_SURCHARGE_PER_KM', '10.00')))
        base_coverage_km = float(SettingsService.get('RIDER_BASE_COVERAGE_KM', 3.0))

        extra_km = max(0, distance_km - base_coverage_km)
        fare = base_fare + speed_addon + (Decimal(str(extra_km)) * surcharge_per_km)

        return fare.quantize(Decimal('0.01'))
