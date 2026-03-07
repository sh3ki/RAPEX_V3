"""RAPEX Delivery Module — Services"""
from decimal import Decimal

from apps.settings_module.services import SettingsService

from .models import DeliveryFareConfig, RiderDeliverySession


class DeliveryService:

    @staticmethod
    def estimate_fare(vehicle_type: str, delivery_speed: str, distance_km: float) -> dict:
        """Return fare breakdown dict."""
        try:
            config = DeliveryFareConfig.objects.get(vehicle_type=vehicle_type, is_active=True)
            base_fare = config.base_fare
            speed_addon = config.standard_addon if delivery_speed == 'STANDARD' else config.saver_addon
            surcharge = max(Decimal('0'), Decimal(str(distance_km)) - config.base_coverage_km) * config.surcharge_per_km
        except DeliveryFareConfig.DoesNotExist:
            # Fallback to PlatformSetting
            base_fare = Decimal(str(SettingsService.get(f'RIDER_BASE_FARE_{vehicle_type}', 40.0)))
            addon_key = f'RIDER_{delivery_speed}_ADDON'
            speed_addon = Decimal(str(SettingsService.get(addon_key, 15.0)))
            surcharge_rate = Decimal(str(SettingsService.get('RIDER_SURCHARGE_PER_KM', 10.0)))
            base_km = Decimal(str(SettingsService.get('RIDER_BASE_COVERAGE_KM', 3.0)))
            surcharge = max(Decimal('0'), Decimal(str(distance_km)) - base_km) * surcharge_rate

        total = base_fare + speed_addon + surcharge
        return {
            'base_fare': str(base_fare),
            'speed_addon': str(speed_addon),
            'surcharge': str(surcharge.quantize(Decimal('0.01'))),
            'total_fare': str(total.quantize(Decimal('0.01'))),
        }

    @staticmethod
    def start_session(rider, order):
        return RiderDeliverySession.objects.create(rider=rider, order=order)

    @staticmethod
    def record_gps_point(session: RiderDeliverySession, lat: float, lng: float, ts: str):
        session.gps_track.append({'lat': lat, 'lng': lng, 'ts': ts})
        session.save(update_fields=['gps_track', 'updated_at'])
