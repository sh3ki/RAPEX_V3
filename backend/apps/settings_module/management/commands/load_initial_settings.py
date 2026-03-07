"""
Load initial platform settings, markup tiers, and commission tiers.
Usage: python manage.py load_initial_settings
"""
from decimal import Decimal

from django.core.management.base import BaseCommand

from apps.settings_module.models import CommissionTier, MarkupTier, PlatformSetting


INITIAL_SETTINGS = [
    ('RIDER_BASE_FARE_BICYCLE', '30.00', 'FLOAT', 'Base delivery fare for bicycle'),
    ('RIDER_BASE_FARE_MOTORCYCLE', '40.00', 'FLOAT', 'Base delivery fare for motorcycle'),
    ('RIDER_BASE_FARE_4_WHEELS', '60.00', 'FLOAT', 'Base delivery fare for 4-wheels'),
    ('RIDER_STANDARD_ADDON', '15.00', 'FLOAT', 'Speed addon for Standard delivery'),
    ('RIDER_SAVER_ADDON', '5.00', 'FLOAT', 'Speed addon for Saver delivery'),
    ('RIDER_SURCHARGE_PER_KM', '10.00', 'FLOAT', 'Surcharge per km beyond base coverage'),
    ('RIDER_BASE_COVERAGE_KM', '3.0', 'FLOAT', 'Base coverage distance in km'),
    ('RIDER_SEARCH_RADIUS_KM', '5.0', 'FLOAT', 'Rider search radius in km'),
    ('RIDER_PING_EXPIRY_SECONDS', '180', 'INT', 'Seconds before rider ping expires'),
    ('ORDER_MERCHANT_TIMEOUT_SECONDS', '180', 'INT', 'Seconds for merchant to accept order'),
    ('RIDER_INITIAL_WALLET_LOAD', '500.00', 'FLOAT', 'Initial wallet load for approved riders'),
    ('LOYALTY_POINTS_PER_ORDER', '10', 'INT', 'Loyalty points earned per successful delivery'),
    ('REFERRAL_POINTS_PER_REFERRAL', '50', 'INT', 'Points per successful referral'),
    ('REFERRAL_MONTHLY_CAP', '500', 'INT', 'Max referral points per month'),
    ('RIDER_DELIVERY_FEE_PLATFORM_SHARE', '20.00', 'FLOAT', 'Platform share % of delivery fee'),
    ('GPS_DELIVERY_RADIUS_M', '50', 'INT', 'GPS accuracy for delivery confirmation (meters)'),
    ('MAX_STORES_PER_MERCHANT', '4', 'INT', 'Max stores per merchant'),
]

INITIAL_MARKUP_TIERS = [
    # (store_type, price_min, price_max, markup_rate)
    ('ALL', Decimal('1.00'), Decimal('100.00'), Decimal('5.00')),
    ('ALL', Decimal('100.01'), Decimal('1000.00'), Decimal('8.00')),
    ('ALL', Decimal('1000.01'), None, Decimal('10.00')),
]

INITIAL_COMMISSION_TIERS = [
    ('ALL', Decimal('0.00'), None, Decimal('10.00')),
]


class Command(BaseCommand):
    help = 'Load initial platform settings, markup tiers, and commission tiers'

    def handle(self, *args, **options):
        created_count = 0

        # Platform settings
        for key, value, vtype, desc in INITIAL_SETTINGS:
            _, created = PlatformSetting.objects.get_or_create(
                key=key,
                defaults={
                    'value': value,
                    'value_type': vtype,
                    'description': desc,
                },
            )
            if created:
                created_count += 1

        self.stdout.write(f"Platform settings: {created_count} created")

        # Markup tiers
        mt_count = 0
        for store_type, price_min, price_max, rate in INITIAL_MARKUP_TIERS:
            _, created = MarkupTier.objects.get_or_create(
                store_type=store_type,
                price_min=price_min,
                defaults={
                    'price_max': price_max,
                    'markup_rate': rate,
                },
            )
            if created:
                mt_count += 1

        self.stdout.write(f"Markup tiers: {mt_count} created")

        # Commission tiers
        ct_count = 0
        for store_type, price_min, price_max, rate in INITIAL_COMMISSION_TIERS:
            _, created = CommissionTier.objects.get_or_create(
                store_type=store_type,
                price_min=price_min,
                defaults={
                    'price_max': price_max,
                    'commission_rate': rate,
                },
            )
            if created:
                ct_count += 1

        self.stdout.write(f"Commission tiers: {ct_count} created")
        self.stdout.write(self.style.SUCCESS('Initial settings loaded successfully.'))
