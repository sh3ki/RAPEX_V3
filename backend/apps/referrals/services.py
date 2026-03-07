"""RAPEX Referrals Module — Services"""
import logging
import secrets
from datetime import datetime

from django.db import transaction
from django.utils import timezone

from apps.settings_module.services import SettingsService

from .models import ReferralCode, ReferralMonthlyTracker, ReferralRecord

logger = logging.getLogger(__name__)


class ReferralService:

    @staticmethod
    def get_or_create_code(user):
        """Get or create referral code for user/rider."""
        code, created = ReferralCode.objects.get_or_create(
            owner_id=user.id,
            owner_role=user.role,
            defaults={'code': ReferralService._generate_code()},
        )
        return code

    @staticmethod
    def _generate_code():
        return 'RAPEX-' + secrets.token_hex(4).upper()

    @staticmethod
    @transaction.atomic
    def credit_referral(referral_record: ReferralRecord):
        """Credit referral points if not at monthly cap."""
        code = referral_record.referral_code
        points_per = int(SettingsService.get('REFERRAL_POINTS_PER_REFERRAL', 50))
        monthly_cap = int(SettingsService.get('REFERRAL_MONTHLY_CAP', 500))
        month_year = datetime.now().strftime('%Y-%m')

        tracker, _ = ReferralMonthlyTracker.objects.get_or_create(
            owner_id=code.owner_id,
            owner_role=code.owner_role,
            month_year=month_year,
            defaults={'points_credited': 0},
        )

        if tracker.points_credited >= monthly_cap:
            referral_record.status = 'CAP_REACHED'
            referral_record.save(update_fields=['status', 'updated_at'])
            return False

        # Credit points
        from apps.wallet.services import LoyaltyPointsService
        LoyaltyPointsService.credit_points(
            user_id=code.owner_id,
            points=points_per,
            description=f'Referral bonus ({referral_record.referred_role})',
        )

        tracker.points_credited += points_per
        tracker.save(update_fields=['points_credited'])

        referral_record.status = 'CREDITED'
        referral_record.points_credited = points_per
        referral_record.credited_at = timezone.now()
        referral_record.save(update_fields=['status', 'points_credited', 'credited_at', 'updated_at'])

        code.total_used += 1
        code.save(update_fields=['total_used', 'updated_at'])

        # Notify
        from apps.notifications.services import NotificationService
        NotificationService.send(
            code.owner_id, code.owner_role, 'referral.credited',
            {'points': points_per},
        )

        logger.info(f"Referral credited: {code.code} → {points_per} pts")
        return True
