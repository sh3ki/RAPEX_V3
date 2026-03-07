"""
RAPEX Core — Mixins
Reusable view/serializer mixins.
"""
import logging

from django.utils import timezone

logger = logging.getLogger(__name__)


class AuditMixin:
    """
    View mixin that logs admin actions to audit trail.
    Override `get_audit_action()` to customize.
    """

    def get_audit_action(self):
        return self.__class__.__name__

    def perform_create(self, serializer):
        instance = serializer.save()
        logger.info(
            f"[AUDIT] {self.request.user} ({self.request.user.role}) "
            f"created {instance.__class__.__name__} {instance.id} "
            f"via {self.get_audit_action()} at {timezone.now()}"
        )
        return instance

    def perform_update(self, serializer):
        instance = serializer.save()
        logger.info(
            f"[AUDIT] {self.request.user} ({self.request.user.role}) "
            f"updated {instance.__class__.__name__} {instance.id} "
            f"via {self.get_audit_action()} at {timezone.now()}"
        )
        return instance


class SoftDeleteMixin:
    """
    View mixin that overrides destroy() to perform soft-delete.
    """

    def perform_destroy(self, instance):
        instance.soft_delete()
