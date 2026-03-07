"""RAPEX Wallet Module — Services"""
import logging
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from apps.core.exceptions import InsufficientBalanceError, RapexAPIException
from apps.settings_module.services import SettingsService

from .models import (
    PointsTransaction,
    RapexWallet,
    RiderRemittanceRecord,
    UserLoyaltyPoints,
    WalletTransaction,
)

logger = logging.getLogger(__name__)


class WalletService:
    """All wallet operations use select_for_update for atomic balance changes."""

    @staticmethod
    @transaction.atomic
    def credit(owner_id, owner_type: str, amount: Decimal, txn_type: str, **kwargs) -> WalletTransaction:
        wallet, _ = RapexWallet.objects.get_or_create(
            owner_id=owner_id, owner_type=owner_type,
            defaults={'balance': Decimal('0')},
        )
        wallet = RapexWallet.objects.select_for_update().get(pk=wallet.pk)
        wallet.balance += amount
        wallet.save(update_fields=['balance', 'updated_at'])

        txn = WalletTransaction.objects.create(
            wallet=wallet,
            transaction_type=txn_type,
            amount=amount,
            balance_after=wallet.balance,
            order_id=kwargs.get('order_id'),
            reference_number=kwargs.get('reference_number'),
            note=kwargs.get('note'),
            performed_by_id=kwargs.get('performed_by_id'),
            performed_by_role=kwargs.get('performed_by_role'),
        )
        logger.info(f"Wallet credited: {owner_type} {owner_id} +₱{amount} → ₱{wallet.balance}")
        return txn

    @staticmethod
    @transaction.atomic
    def debit(owner_id, owner_type: str, amount: Decimal, txn_type: str, **kwargs) -> WalletTransaction:
        wallet = RapexWallet.objects.select_for_update().get(
            owner_id=owner_id, owner_type=owner_type,
        )
        if wallet.balance < amount:
            raise InsufficientBalanceError()

        wallet.balance -= amount
        wallet.save(update_fields=['balance', 'updated_at'])

        txn = WalletTransaction.objects.create(
            wallet=wallet,
            transaction_type=txn_type,
            amount=-amount,
            balance_after=wallet.balance,
            order_id=kwargs.get('order_id'),
            reference_number=kwargs.get('reference_number'),
            note=kwargs.get('note'),
            performed_by_id=kwargs.get('performed_by_id'),
            performed_by_role=kwargs.get('performed_by_role'),
        )
        logger.info(f"Wallet debited: {owner_type} {owner_id} -₱{amount} → ₱{wallet.balance}")
        return txn

    @staticmethod
    def get_balance(owner_id, owner_type: str) -> Decimal:
        try:
            wallet = RapexWallet.objects.get(owner_id=owner_id, owner_type=owner_type)
            return wallet.balance
        except RapexWallet.DoesNotExist:
            return Decimal('0')

    @staticmethod
    @transaction.atomic
    def process_top_up(rider_id, amount: Decimal, admin_id=None):
        """Top-up rider wallet. Auto-deduct overdue remittance first."""
        # Check for overdue remittance
        overdue = RiderRemittanceRecord.objects.filter(
            rider_id=rider_id, status='OVERDUE',
        ).order_by('period_start').first()

        remaining = amount
        if overdue:
            deduct = min(remaining, overdue.amount_owed - overdue.amount_paid)
            WalletService.credit(rider_id, 'RIDER', amount, 'TOP_UP',
                                 performed_by_id=admin_id, performed_by_role='ADMIN')
            WalletService.debit(rider_id, 'RIDER', deduct, 'REMITTANCE_DEDUCTED',
                                note=f'Auto-deducted for overdue remittance {overdue.period_start}–{overdue.period_end}')
            overdue.amount_paid += deduct
            if overdue.amount_paid >= overdue.amount_owed:
                overdue.status = 'PAID'
                overdue.paid_at = timezone.now()
            overdue.save()
            remaining -= deduct
            logger.info(f"Overdue remittance auto-deducted: ₱{deduct} for rider {rider_id}")
        else:
            WalletService.credit(rider_id, 'RIDER', amount, 'TOP_UP',
                                 performed_by_id=admin_id, performed_by_role='ADMIN')

        return remaining

    @staticmethod
    def process_order_payment(rider_id, order):
        """Debit rider wallet for order payment to merchant."""
        WalletService.debit(
            rider_id, 'RIDER', order.total_amount, 'PAYMENT_TO_MERCHANT',
            order_id=order.id, note=f'Payment for order {order.id}',
        )

    @staticmethod
    def deduct_commission(rider_id, order):
        """Debit commission from rider after delivery."""
        commission_amount = order.platform_commission or Decimal('0')
        if commission_amount > 0:
            WalletService.debit(
                rider_id, 'RIDER', commission_amount, 'COMMISSION_DEDUCTED',
                order_id=order.id, note=f'Commission for order {order.id}',
            )

    @staticmethod
    def credit_initial_load(rider_id):
        """Credit ₱500 on KYC approval."""
        amount = Decimal(str(SettingsService.get('RIDER_INITIAL_WALLET_LOAD', '500.00')))
        WalletService.credit(
            rider_id, 'RIDER', amount, 'INITIAL_LOAD',
            note='Initial wallet load on KYC approval',
            performed_by_role='SYSTEM',
        )

    @staticmethod
    def credit_delivery_fee(rider_id, order, delivery_fee: Decimal):
        """Credit rider's share of delivery fee."""
        platform_share_pct = Decimal(str(SettingsService.get('RIDER_DELIVERY_FEE_PLATFORM_SHARE', '20.00')))
        rider_share = delivery_fee * (1 - platform_share_pct / Decimal('100'))
        WalletService.credit(
            rider_id, 'RIDER', rider_share.quantize(Decimal('0.01')), 'DELIVERY_FEE_EARNED',
            order_id=order.id, note=f'Delivery fee for order {order.id}',
        )


class LoyaltyPointsService:

    @staticmethod
    def credit_points(user_id, order_id=None, note=None):
        """Credit loyalty points after successful delivery."""
        points_per_order = int(SettingsService.get('LOYALTY_POINTS_PER_ORDER', 10))
        lp, _ = UserLoyaltyPoints.objects.get_or_create(
            user_id=user_id, defaults={'total_points': 0, 'lifetime_earned': 0},
        )
        lp.total_points += points_per_order
        lp.lifetime_earned += points_per_order
        lp.save()

        PointsTransaction.objects.create(
            user_id=user_id,
            transaction_type='EARNED',
            points=points_per_order,
            order_id=order_id,
            note=note or 'Points earned from order delivery',
        )
        logger.info(f"User {user_id} earned {points_per_order} points")
        return points_per_order

    @staticmethod
    def redeem_points(user_id, points_to_redeem: int) -> Decimal:
        """Redeem points as peso discount. Returns discount amount."""
        lp = UserLoyaltyPoints.objects.get(user_id=user_id)
        if lp.total_points < points_to_redeem:
            raise RapexAPIException('Insufficient points.', code='insufficient_points')

        point_value = Decimal(str(SettingsService.get('LOYALTY_POINT_VALUE_PESOS', '1.00')))
        discount = Decimal(points_to_redeem) * point_value

        lp.total_points -= points_to_redeem
        lp.save()

        PointsTransaction.objects.create(
            user_id=user_id,
            transaction_type='REDEEMED',
            points=-points_to_redeem,
            note=f'Redeemed {points_to_redeem} points for ₱{discount} discount',
        )
        logger.info(f"User {user_id} redeemed {points_to_redeem} points for ₱{discount}")
        return discount


class RemittanceService:

    @staticmethod
    def create_weekly_remittance(period_start, period_end):
        """Create remittance records for all riders with balance owed."""
        from apps.accounts.models import RiderProfile
        from datetime import timedelta

        riders = RiderProfile.objects.filter(kyc_status='APPROVED', is_deleted=False)
        due_date = period_end + timedelta(days=3)
        created = 0

        for rider in riders:
            # Sum commissions for the period
            total_owed = WalletTransaction.objects.filter(
                wallet__owner_id=rider.user_id,
                wallet__owner_type='RIDER',
                transaction_type='COMMISSION_DEDUCTED',
                created_at__date__gte=period_start,
                created_at__date__lte=period_end,
            ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0')

            if abs(total_owed) > 0:
                RiderRemittanceRecord.objects.create(
                    rider=rider,
                    period_start=period_start,
                    period_end=period_end,
                    amount_owed=abs(total_owed),
                    due_date=due_date,
                )
                created += 1

        logger.info(f"Created {created} remittance records for {period_start}–{period_end}")
        return created

    @staticmethod
    def mark_overdue():
        """Mark records past due_date as OVERDUE."""
        from django.utils import timezone
        today = timezone.now().date()
        updated = RiderRemittanceRecord.objects.filter(
            status__in=['CURRENT', 'DUE_SOON'],
            due_date__lt=today,
        ).update(status='OVERDUE')
        logger.info(f"Marked {updated} remittance records as OVERDUE")
        return updated
