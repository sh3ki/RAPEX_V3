"""RAPEX Merchant — Celery Tasks"""
import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name='merchant.auto_close_stores_by_schedule')
def auto_close_stores_by_schedule():
    """
    Hourly task — close stores past their scheduled close_time
    and open stores at their scheduled open_time for the current day.
    """
    from datetime import datetime

    from django.utils import timezone

    from apps.merchant.models import MerchantStore, StoreSchedule

    now = timezone.localtime()
    today_dow = now.weekday()  # 0=Monday
    current_time = now.time()

    # Close stores past their close_time
    schedules_to_close = StoreSchedule.objects.filter(
        day_of_week=today_dow,
        is_closed=False,
        close_time__lte=current_time,
    ).select_related('store')

    closed = 0
    for sched in schedules_to_close:
        if sched.store.is_open:
            sched.store.is_open = False
            sched.store.save(update_fields=['is_open', 'updated_at'])
            closed += 1

    # Open stores at their open_time
    schedules_to_open = StoreSchedule.objects.filter(
        day_of_week=today_dow,
        is_closed=False,
        open_time__lte=current_time,
        close_time__gt=current_time,
    ).select_related('store')

    opened = 0
    for sched in schedules_to_open:
        if not sched.store.is_open:
            sched.store.is_open = True
            sched.store.save(update_fields=['is_open', 'updated_at'])
            opened += 1

    logger.info(f"Store schedule check: opened={opened}, closed={closed}")
    return {'opened': opened, 'closed': closed}
