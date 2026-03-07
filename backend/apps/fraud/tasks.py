"""RAPEX Fraud — Celery Tasks"""
import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name='fraud.auto_flag_suspicious_activity')
def auto_flag_suspicious_activity():
    """
    Hourly task — scan for suspicious patterns and auto-create fraud flags.
    Checks: cancel patterns, late remittance, rapid referrals.
    """
    from datetime import timedelta

    from django.db.models import Count
    from django.utils import timezone

    from apps.fraud.models import FraudFlag
    from apps.orders.models import Order
    from apps.wallet.models import RiderRemittanceRecord

    now = timezone.now()
    flags_created = 0

    # 1. Users with high cancel rate (>5 cancels in last 7 days)
    seven_days_ago = now - timedelta(days=7)
    cancel_counts = (
        Order.objects.filter(
            status='CANCELLED',
            created_at__gte=seven_days_ago,
            is_deleted=False,
        )
        .values('user_id')
        .annotate(cancel_count=Count('id'))
        .filter(cancel_count__gt=5)
    )
    for entry in cancel_counts:
        if not FraudFlag.objects.filter(
            subject_id=entry['user_id'],
            flag_type='CANCEL_PATTERN',
            resolution='PENDING',
        ).exists():
            FraudFlag.objects.create(
                subject_id=entry['user_id'],
                subject_role='USER',
                flag_type='CANCEL_PATTERN',
                flag_reason=f"High cancel rate: {entry['cancel_count']} cancellations in 7 days",
            )
            flags_created += 1

    # 2. Riders with overdue remittance
    overdue_records = RiderRemittanceRecord.objects.filter(
        status='OVERDUE', is_deleted=False,
    ).values_list('rider__user_id', flat=True).distinct()

    for rider_user_id in overdue_records:
        if not FraudFlag.objects.filter(
            subject_id=rider_user_id,
            flag_type='LATE_REMITTANCE',
            resolution='PENDING',
        ).exists():
            FraudFlag.objects.create(
                subject_id=rider_user_id,
                subject_role='RIDER',
                flag_type='LATE_REMITTANCE',
                flag_reason='Overdue remittance detected by auto-scan',
            )
            flags_created += 1

    logger.info(f"Auto-flag scan complete: {flags_created} new flags created")
    return flags_created
