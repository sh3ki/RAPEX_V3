"""RAPEX Merchant Module — Services"""
import logging
import math
from decimal import Decimal

from django.db.models import F, FloatField, Value
from django.db.models.functions import ACos, Cos, Radians, Sin

from apps.core.exceptions import MaxStoresReached, RapexAPIException

from .models import MerchantStore

logger = logging.getLogger(__name__)

MAX_STORES = 4


class MerchantService:
    @staticmethod
    def create_store(merchant, store_type: str, data: dict) -> MerchantStore:
        """Create a store, enforcing max-store and uniqueness limits."""
        existing_count = MerchantStore.objects.filter(
            merchant=merchant, is_deleted=False,
        ).count()
        if existing_count >= MAX_STORES:
            raise MaxStoresReached()

        if MerchantStore.objects.filter(
            merchant=merchant, store_type=store_type, is_deleted=False,
        ).exists():
            raise RapexAPIException(
                f'You already have a {store_type} store.',
                code='duplicate_store_type',
            )

        store = MerchantStore.objects.create(
            merchant=merchant,
            store_type=store_type,
            **data,
        )
        logger.info(f"Store created: {store.display_name} ({store_type}) for merchant {merchant.id}")
        return store

    @staticmethod
    def toggle_open(store: MerchantStore, is_open: bool):
        store.is_open = is_open
        store.save(update_fields=['is_open', 'updated_at'])
        logger.info(f"Store {store.id} is_open → {is_open}")

    @staticmethod
    def get_nearby_stores(lat: float, lng: float, radius_km: float = 5.0, store_type: str = None):
        """
        Haversine distance query — return open & visible stores within radius.
        """
        lat_r = math.radians(lat)
        lng_r = math.radians(lng)

        qs = MerchantStore.objects.filter(
            is_open=True, is_visible=True, is_deleted=False,
            merchant__business_lat__isnull=False,
            merchant__business_lng__isnull=False,
        )
        if store_type:
            qs = qs.filter(store_type=store_type)

        # Annotate with Haversine distance
        qs = qs.annotate(
            distance_km=Value(6371.0, output_field=FloatField()) * ACos(
                Cos(Radians(Value(lat, output_field=FloatField()))) *
                Cos(Radians(F('merchant__business_lat'))) *
                Cos(Radians(F('merchant__business_lng')) - Radians(Value(lng, output_field=FloatField()))) +
                Sin(Radians(Value(lat, output_field=FloatField()))) *
                Sin(Radians(F('merchant__business_lat')))
            )
        ).filter(distance_km__lte=radius_km).order_by('distance_km')

        return qs
