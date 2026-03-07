"""
RAPEX Core — Permission Classes
Role-based and context-based permissions for DRF views.
"""
from rest_framework.permissions import BasePermission


class IsUser(BasePermission):
    """Allow only users with role == USER."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == 'USER'
        )


class IsMerchant(BasePermission):
    """Allow only users with role == MERCHANT."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == 'MERCHANT'
        )


class IsRider(BasePermission):
    """Allow only users with role == RIDER."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == 'RIDER'
        )


class IsAdmin(BasePermission):
    """Allow only users with role == ADMIN."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == 'ADMIN'
        )


class IsSuperAdmin(BasePermission):
    """Allow only users with role == SUPERADMIN."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == 'SUPERADMIN'
        )


class IsAdminOrSuperAdmin(BasePermission):
    """Allow ADMIN or SUPERADMIN roles."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ('ADMIN', 'SUPERADMIN')
        )


class IsAdminWithPermission(BasePermission):
    """
    Check specific permission key in AdminProfile.permissions JSONB.
    Subclass and set `required_permission` attribute.
    """
    required_permission = None

    def has_permission(self, request, view):
        if not (request.user.is_authenticated and request.user.role == 'ADMIN'):
            return False
        try:
            profile = request.user.adminprofile
            return profile.permissions.get(self.required_permission, False)
        except Exception:
            return False


class IsKYCApproved(BasePermission):
    """Check that the user's profile has kyc_status == APPROVED."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        role = request.user.role
        try:
            if role == 'MERCHANT':
                return request.user.merchantprofile.kyc_status == 'APPROVED'
            elif role == 'RIDER':
                return request.user.riderprofile.kyc_status == 'APPROVED'
            elif role == 'USER':
                return request.user.userprofile.kyc_status == 'APPROVED'
        except Exception:
            return False
        return False


class IsRiderOnline(BasePermission):
    """Check that the rider is currently online."""

    def has_permission(self, request, view):
        if not (request.user.is_authenticated and request.user.role == 'RIDER'):
            return False
        try:
            return request.user.riderprofile.is_online
        except Exception:
            return False
