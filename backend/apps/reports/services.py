"""RAPEX Reports Module — Services (Report generation)"""
import csv
import io
import logging
from datetime import timedelta
from decimal import Decimal

from django.db.models import Sum, Count, Q, Avg
from django.utils import timezone

logger = logging.getLogger(__name__)


class ReportService:

    @staticmethod
    def daily_report(date=None):
        from apps.orders.models import Order
        if not date:
            date = timezone.now().date()

        orders = Order.objects.filter(
            created_at__date=date, is_deleted=False,
        )
        return {
            'date': date.isoformat(),
            'total_orders': orders.count(),
            'completed_orders': orders.filter(status='DELIVERED').count(),
            'cancelled_orders': orders.filter(status__in=['CANCELLED', 'TIMEOUT_CANCELLED']).count(),
            'gmv': str(orders.filter(status='DELIVERED').aggregate(t=Sum('total_amount'))['t'] or 0),
            'total_commission': str(orders.filter(status='DELIVERED').aggregate(t=Sum('platform_commission'))['t'] or 0),
            'total_delivery_fees': str(orders.filter(status='DELIVERED').aggregate(t=Sum('delivery_fee'))['t'] or 0),
        }

    @staticmethod
    def weekly_report(start_date=None):
        if not start_date:
            start_date = timezone.now().date() - timedelta(days=7)
        end_date = start_date + timedelta(days=7)

        from apps.orders.models import Order
        orders = Order.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lt=end_date,
            is_deleted=False,
        )
        return {
            'period': f"{start_date.isoformat()} to {end_date.isoformat()}",
            'total_orders': orders.count(),
            'completed': orders.filter(status='DELIVERED').count(),
            'gmv': str(orders.filter(status='DELIVERED').aggregate(t=Sum('total_amount'))['t'] or 0),
        }

    @staticmethod
    def by_store_type():
        from apps.orders.models import Order
        result = Order.objects.filter(
            status='DELIVERED', is_deleted=False,
        ).values('store_type').annotate(
            count=Count('id'),
            revenue=Sum('total_amount'),
            commission=Sum('platform_commission'),
        )
        return list(result)

    @staticmethod
    def export_csv(data: list, filename='report'):
        if not data:
            return ''
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
        return output.getvalue()
