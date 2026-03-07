"""RAPEX SuperAdmin Module — Views"""
from django.db.models import Sum, Count
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsSuperAdmin


# ═══════════════════════════════════════════════════════════════════
# DASHBOARD
# ═══════════════════════════════════════════════════════════════════
class SuperAdminDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        from apps.orders.models import Order
        from apps.accounts.models import CustomUser, MerchantProfile, RiderProfile
        from apps.wallet.models import RapexWallet

        today = timezone.now().date()
        orders = Order.objects.filter(is_deleted=False)
        today_orders = orders.filter(created_at__date=today)

        return Response({
            'revenue_today': str(
                today_orders.filter(status='DELIVERED').aggregate(t=Sum('total_amount'))['t'] or 0
            ),
            'active_orders': orders.filter(
                status__in=['PENDING_MERCHANT', 'PREPARING', 'COOKING', 'IN_TRANSIT'],
            ).count(),
            'total_users': CustomUser.objects.filter(role='USER', is_active=True).count(),
            'active_merchants': MerchantProfile.objects.filter(kyc_status='APPROVED').count(),
            'active_riders': RiderProfile.objects.filter(is_online=True).count(),
            'total_riders': RiderProfile.objects.filter(kyc_status='APPROVED').count(),
            'platform_wallet_total': str(
                RapexWallet.objects.aggregate(t=Sum('balance'))['t'] or 0
            ),
            'total_commission': str(
                orders.filter(status='DELIVERED').aggregate(t=Sum('platform_commission'))['t'] or 0
            ),
        })


# ═══════════════════════════════════════════════════════════════════
# ADMIN CRUD
# ═══════════════════════════════════════════════════════════════════
class SuperAdminAdminListView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        from apps.accounts.models import CustomUser
        admins = CustomUser.objects.filter(role='ADMIN', is_deleted=False).select_related('adminprofile')
        data = [{
            'id': str(a.id), 'phone': a.phone, 'email': a.email,
            'full_name': getattr(a, 'adminprofile', None) and a.adminprofile.full_name,
            'sub_role': getattr(a, 'adminprofile', None) and a.adminprofile.sub_role,
            'is_active': a.is_active,
            'last_login': a.last_login.isoformat() if a.last_login else None,
        } for a in admins]
        return Response(data)

    def post(self, request):
        from apps.accounts.models import CustomUser, AdminProfile
        d = request.data
        user = CustomUser.objects.create_user(
            phone=d['phone'], password=d.get('password', 'admin123'),
            role='ADMIN', email=d.get('email'),
        )
        AdminProfile.objects.create(
            user=user,
            full_name=d.get('full_name', ''),
            sub_role=d.get('sub_role', 'OPERATIONS'),
            permissions=d.get('permissions', {}),
        )
        _log_sa_audit(request, 'admin_created', 'ADMIN', user.id)
        return Response({'id': str(user.id)}, status=status.HTTP_201_CREATED)


class SuperAdminAdminDetailView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def patch(self, request, pk):
        from apps.accounts.models import CustomUser, AdminProfile
        user = CustomUser.objects.get(pk=pk, role='ADMIN')
        profile = user.adminprofile
        d = request.data
        if 'full_name' in d:
            profile.full_name = d['full_name']
        if 'sub_role' in d:
            profile.sub_role = d['sub_role']
        if 'permissions' in d:
            profile.permissions = d['permissions']
        if 'is_active' in d:
            user.is_active = d['is_active']
            user.save(update_fields=['is_active'])
        profile.save()
        _log_sa_audit(request, 'admin_updated', 'ADMIN', pk)
        return Response({'status': 'updated'})

    def delete(self, request, pk):
        from apps.accounts.models import CustomUser
        user = CustomUser.objects.get(pk=pk, role='ADMIN')
        user.soft_delete()
        _log_sa_audit(request, 'admin_deleted', 'ADMIN', pk)
        return Response({'status': 'deactivated'})


# ═══════════════════════════════════════════════════════════════════
# PLATFORM SETTINGS
# ═══════════════════════════════════════════════════════════════════
class SuperAdminSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        from apps.settings_module.services import SettingsService
        return Response(SettingsService.get_all())

    def patch(self, request):
        from apps.settings_module.services import SettingsService
        SettingsService.bulk_update(request.data)
        _log_sa_audit(request, 'settings_updated', after_data=request.data)
        return Response({'status': 'updated'})


# ═══════════════════════════════════════════════════════════════════
# WALLET LEDGER
# ═══════════════════════════════════════════════════════════════════
class SuperAdminWalletLedgerView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        from apps.wallet.models import WalletTransaction
        txns = WalletTransaction.objects.filter(is_deleted=False).order_by('-created_at')[:100]
        data = [{
            'id': str(t.id), 'wallet': str(t.wallet_id),
            'type': t.transaction_type, 'amount': str(t.amount),
            'balance_after': str(t.balance_after),
            'description': t.description,
            'created_at': t.created_at.isoformat(),
        } for t in txns]
        return Response(data)


class SuperAdminWalletAdjustView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request):
        from apps.wallet.services import WalletService
        d = request.data
        owner_id = d['owner_id']
        owner_type = d['owner_type']
        amount = float(d['amount'])
        adj_type = d.get('adjustment_type', 'credit')

        if adj_type == 'credit':
            WalletService.credit(owner_id, owner_type, amount, 'ADMIN_ADJUSTMENT', d.get('reason', ''))
        else:
            WalletService.debit(owner_id, owner_type, amount, 'ADMIN_ADJUSTMENT', d.get('reason', ''))

        _log_sa_audit(request, 'wallet_adjust', owner_type, owner_id, after_data=d)
        return Response({'status': 'adjusted'})


# ═══════════════════════════════════════════════════════════════════
# FRAUD & BLACKLIST
# ═══════════════════════════════════════════════════════════════════
class SuperAdminBlacklistView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        from apps.fraud.models import AccountBlacklist
        entries = AccountBlacklist.objects.filter(is_deleted=False)[:50]
        data = [{
            'id': str(e.id), 'subject_id': str(e.subject_id),
            'subject_role': e.subject_role, 'reason': e.reason,
            'is_permanent': e.is_permanent,
            'created_at': e.created_at.isoformat(),
        } for e in entries]
        return Response(data)

    def post(self, request):
        from apps.fraud.services import FraudService
        entry = FraudService.blacklist(
            subject_id=request.data['subject_id'],
            subject_role=request.data['subject_role'],
            reason=request.data['reason'],
            admin_profile=None,  # SuperAdmin
            permanent=request.data.get('is_permanent', True),
        )
        _log_sa_audit(request, 'account_blacklisted', request.data['subject_role'], request.data['subject_id'])
        return Response({'id': str(entry.id)}, status=status.HTTP_201_CREATED)


# ═══════════════════════════════════════════════════════════════════
# AUDIT LOG
# ═══════════════════════════════════════════════════════════════════
class SuperAdminAuditLogView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        from .models import SuperAdminAuditLog
        from apps.admin_panel.models import AdminAuditLog

        sa_logs = list(SuperAdminAuditLog.objects.all()[:50])
        admin_logs = list(AdminAuditLog.objects.all()[:50])

        all_logs = sorted(
            [{'source': 'superadmin', 'admin_id': str(l.admin_id), 'action': l.action,
              'target_type': l.target_type, 'created_at': l.created_at.isoformat()} for l in sa_logs] +
            [{'source': 'admin', 'admin_id': str(l.admin_id), 'action': l.action,
              'target_type': l.target_type, 'created_at': l.created_at.isoformat()} for l in admin_logs],
            key=lambda x: x['created_at'], reverse=True,
        )
        return Response(all_logs[:100])


# ═══════════════════════════════════════════════════════════════════
# AUDIT HELPER
# ═══════════════════════════════════════════════════════════════════
def _log_sa_audit(request, action, target_type='', target_id=None, before_data=None, after_data=None):
    from .models import SuperAdminAuditLog
    SuperAdminAuditLog.objects.create(
        admin_id=request.user.id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        before_data=before_data,
        after_data=after_data,
        ip_address=request.META.get('REMOTE_ADDR'),
    )
