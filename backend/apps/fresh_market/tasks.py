"""RAPEX Fresh Market — Celery Tasks"""
import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name='fresh_market.reset_freshness_daily')
def reset_freshness_daily():
    """Reset all fresh market products with auto_reset_daily=True to FRESH_TODAY."""
    from .models import FreshMarketProduct
    updated = FreshMarketProduct.objects.filter(
        auto_reset_daily=True, is_deleted=False,
    ).update(freshness_status='FRESH_TODAY')
    logger.info(f"Daily freshness reset: {updated} products updated")
    return updated
