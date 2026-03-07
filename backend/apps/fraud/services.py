"""RAPEX Fraud Module — Services"""
import logging

from django.utils import timezone

from .models import AccountBlacklist, FraudFlag, InvestigationCase

logger = logging.getLogger(__name__)


class FraudService:

    @staticmethod
    def create_flag(subject_id, subject_role, flag_type, reason, auto=True):
        flag = FraudFlag.objects.create(
            subject_id=subject_id,
            subject_role=subject_role,
            flag_type=flag_type,
            flag_reason=reason,
            auto_flagged=auto,
        )
        logger.warning(f"Fraud flag created: {flag_type} for {subject_role}:{subject_id}")
        return flag

    @staticmethod
    def review_flag(flag: FraudFlag, admin_profile, resolution: str, notes: str = ''):
        flag.is_reviewed = True
        flag.reviewed_by = admin_profile
        flag.reviewed_at = timezone.now()
        flag.resolution = resolution
        flag.save(update_fields=[
            'is_reviewed', 'reviewed_by', 'reviewed_at', 'resolution', 'updated_at',
        ])

        if resolution == 'BLACKLISTED':
            FraudService.blacklist(
                flag.subject_id, flag.subject_role,
                f"Auto-blacklisted from fraud flag: {flag.flag_type}",
                admin_profile,
            )
        return flag

    @staticmethod
    def blacklist(subject_id, subject_role, reason, admin_profile, permanent=True, expires_at=None):
        entry = AccountBlacklist.objects.create(
            subject_id=subject_id,
            subject_role=subject_role,
            reason=reason,
            blacklisted_by=admin_profile,
            is_permanent=permanent,
            expires_at=expires_at,
        )
        logger.warning(f"Account blacklisted: {subject_role}:{subject_id}")
        return entry

    @staticmethod
    def is_blacklisted(subject_id):
        from django.db.models import Q
        return AccountBlacklist.objects.filter(
            subject_id=subject_id, is_deleted=False,
        ).filter(
            Q(is_permanent=True) | Q(expires_at__gt=timezone.now())
        ).exists()

    @staticmethod
    def create_case(fraud_flag, subject_id, subject_role, title, priority, admin_profile):
        case = InvestigationCase.objects.create(
            fraud_flag=fraud_flag,
            subject_id=subject_id,
            subject_role=subject_role,
            title=title,
            priority=priority,
            opened_by=admin_profile,
        )
        return case
