"""RAPEX Wallet — Celery Tasks"""
import logging
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(name='wallet.create_weekly_remittance')
def create_weekly_remittance():
    """Run every Monday midnight — create remittance for previous week."""
    from .services import RemittanceService
    today = timezone.now().date()
    period_end = today - timedelta(days=1)
    period_start = period_end - timedelta(days=6)
    return RemittanceService.create_weekly_remittance(period_start, period_end)


@shared_task(name='wallet.mark_overdue_remittances')
def mark_overdue_remittances():
    """Run daily — mark overdue remittance records."""
    from .services import RemittanceService
    return RemittanceService.mark_overdue()


@shared_task(name='wallet.credit_loyalty_points_delayed')
def credit_loyalty_points_delayed(user_id, order_id):
    """Credit loyalty points 30s after delivery confirmation."""
    from .services import LoyaltyPointsService
    return LoyaltyPointsService.credit_points(user_id, order_id=order_id)
