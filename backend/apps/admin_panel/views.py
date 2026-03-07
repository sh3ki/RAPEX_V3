"""RAPEX Admin Panel — Views"""
from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsAdmin, IsAdminOrSuperAdmin


# ═══════════════════════════════════════════════════════════════════
# DASHBOARD
# ═══════════════════════════════════════════════════════════════════
class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from apps.orders.models import Order
        from apps.accounts.models import CustomUser, MerchantProfile, RiderProfile

        today = timezone.now().date()
        orders_today = Order.objects.filter(created_at__date=today, is_deleted=False)

        return Response({
            'revenue_today': str(
                orders_today.filter(status='DELIVERED').aggregate(t=Sum('total_amount'))['t'] or 0
            ),
            'active_orders': Order.objects.filter(
                status__in=['PENDING_MERCHANT', 'PREPARING', 'COOKING', 'IN_TRANSIT'],
            ).count(),
            'pending_kyc': {
                'users': CustomUser.objects.filter(role='USER', userprofile__kyc_status='PENDING').count(),
                'merchants': MerchantProfile.objects.filter(kyc_status='PENDING').count(),
                'riders': RiderProfile.objects.filter(kyc_status='PENDING').count(),
            },
            'active_riders': RiderProfile.objects.filter(is_online=True).count(),
            'total_orders_today': orders_today.count(),
            'completed_today': orders_today.filter(status='DELIVERED').count(),
        })


# ═══════════════════════════════════════════════════════════════════
# USER MANAGEMENT
# ═══════════════════════════════════════════════════════════════════
class AdminUserListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from apps.accounts.models import CustomUser
        users = CustomUser.objects.filter(role='USER', is_deleted=False).select_related('userprofile')
        search = request.query_params.get('search')
        if search:
            users = users.filter(
                Q(phone__icontains=search) | Q(userprofile__full_name__icontains=search)
            )
        data = [{
            'id': str(u.id), 'phone': u.phone,
            'full_name': getattr(u, 'userprofile', None) and u.userprofile.full_name,
            'kyc_status': getattr(u, 'userprofile', None) and u.userprofile.kyc_status,
        } for u in users[:50]]
        return Response(data)


class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, pk):
        from apps.accounts.models import CustomUser
        from apps.accounts.serializers import UserSerializer
        user = CustomUser.objects.get(pk=pk, role='USER')
        return Response(UserSerializer(user).data)


class AdminUserKYCApproveView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        from apps.accounts.models import CustomUser
        user = CustomUser.objects.get(pk=pk, role='USER')
        user.userprofile.kyc_status = 'APPROVED'
        user.userprofile.save(update_fields=['kyc_status', 'updated_at'])
        from apps.notifications.services import NotificationService
        NotificationService.send(user.id, 'USER', 'kyc.approved')
        _log_audit(request, 'user_kyc_approve', 'USER', pk)
        return Response({'status': 'approved'})


class AdminUserKYCRejectView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        from apps.accounts.models import CustomUser
        user = CustomUser.objects.get(pk=pk, role='USER')
        user.userprofile.kyc_status = 'REJECTED'
        user.userprofile.save(update_fields=['kyc_status', 'updated_at'])
        from apps.notifications.services import NotificationService
        NotificationService.send(user.id, 'USER', 'kyc.rejected')
        _log_audit(request, 'user_kyc_reject', 'USER', pk)
        return Response({'status': 'rejected'})


# ═══════════════════════════════════════════════════════════════════
# MERCHANT MANAGEMENT
# ═══════════════════════════════════════════════════════════════════
class AdminMerchantListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from apps.accounts.models import MerchantProfile
        merchants = MerchantProfile.objects.filter(is_deleted=False)
        search = request.query_params.get('search')
        if search:
            merchants = merchants.filter(
                Q(business_name__icontains=search) | Q(user__phone__icontains=search)
            )
        data = [{
            'id': str(m.user_id), 'business_name': m.business_name,
            'kyc_status': m.kyc_status, 'phone': m.user.phone,
        } for m in merchants.select_related('user')[:50]]
        return Response(data)


class AdminMerchantKYCApproveView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        from apps.accounts.models import MerchantProfile
        mp = MerchantProfile.objects.get(user_id=pk)
        mp.kyc_status = 'APPROVED'
        mp.save(update_fields=['kyc_status', 'updated_at'])
        from apps.notifications.services import NotificationService
        NotificationService.send(mp.user_id, 'MERCHANT', 'kyc.approved')
        _log_audit(request, 'merchant_kyc_approve', 'MERCHANT', pk)
        return Response({'status': 'approved'})


class AdminMerchantKYCRejectView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        from apps.accounts.models import MerchantProfile
        mp = MerchantProfile.objects.get(user_id=pk)
        mp.kyc_status = 'REJECTED'
        mp.save(update_fields=['kyc_status', 'updated_at'])
        from apps.notifications.services import NotificationService
        NotificationService.send(mp.user_id, 'MERCHANT', 'kyc.rejected')
        _log_audit(request, 'merchant_kyc_reject', 'MERCHANT', pk)
        return Response({'status': 'rejected'})


# ═══════════════════════════════════════════════════════════════════
# RIDER MANAGEMENT
# ═══════════════════════════════════════════════════════════════════
class AdminRiderListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from apps.accounts.models import RiderProfile
        riders = RiderProfile.objects.filter(is_deleted=False).select_related('user')
        search = request.query_params.get('search')
        if search:
            riders = riders.filter(
                Q(full_name__icontains=search) | Q(user__phone__icontains=search)
            )
        data = [{
            'id': str(r.user_id), 'full_name': r.full_name,
            'vehicle_type': r.vehicle_type, 'kyc_status': r.kyc_status,
            'is_online': r.is_online,
        } for r in riders[:50]]
        return Response(data)


class AdminRiderKYCApproveView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        from apps.accounts.models import RiderProfile
        rp = RiderProfile.objects.get(user_id=pk)
        rp.kyc_status = 'APPROVED'
        rp.save(update_fields=['kyc_status', 'updated_at'])

        # Credit ₱500 initial wallet load
        from apps.wallet.services import WalletService
        WalletService.credit_initial_load(pk)

        from apps.notifications.services import NotificationService
        NotificationService.send(rp.user_id, 'RIDER', 'kyc.approved')
        _log_audit(request, 'rider_kyc_approve', 'RIDER', pk)
        return Response({'status': 'approved'})


class AdminRiderKYCRejectView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        from apps.accounts.models import RiderProfile
        rp = RiderProfile.objects.get(user_id=pk)
        rp.kyc_status = 'REJECTED'
        rp.save(update_fields=['kyc_status', 'updated_at'])
        from apps.notifications.services import NotificationService
        NotificationService.send(rp.user_id, 'RIDER', 'kyc.rejected')
        _log_audit(request, 'rider_kyc_reject', 'RIDER', pk)
        return Response({'status': 'rejected'})


class AdminRiderWalletLoadView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        amount = request.data.get('amount')
        from apps.wallet.services import WalletService
        WalletService.process_top_up(pk, float(amount), performed_by=request.user)
        _log_audit(request, 'rider_wallet_load', 'RIDER', pk, after_data={'amount': amount})
        return Response({'status': 'loaded'})


class AdminRiderIncentiveConfirmView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        from apps.wallet.services import WalletService
        WalletService.credit(pk, 'RIDER', 250, 'INCENTIVE_CREDIT', 'Weekly incentive bonus')
        _log_audit(request, 'rider_incentive_confirm', 'RIDER', pk)
        return Response({'status': 'incentive_credited'})


# ═══════════════════════════════════════════════════════════════════
# REPORTS
# ═══════════════════════════════════════════════════════════════════
class AdminReportDailyView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from apps.reports.services import ReportService
        return Response(ReportService.daily_report())


class AdminReportWeeklyView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from apps.reports.services import ReportService
        return Response(ReportService.weekly_report())


class AdminReportByStoreTypeView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from apps.reports.services import ReportService
        return Response(ReportService.by_store_type())


# ═══════════════════════════════════════════════════════════════════
# NOTIFICATIONS
# ═══════════════════════════════════════════════════════════════════
class AdminNotificationLogView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from apps.notifications.models import Notification
        qs = Notification.objects.filter(is_deleted=False)[:50]
        data = [{
            'id': str(n.id), 'event_type': n.event_type,
            'recipient_role': n.recipient_role, 'delivery_status': n.delivery_status,
            'created_at': n.created_at.isoformat(),
        } for n in qs]
        return Response(data)


class AdminNotificationBroadcastView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        from apps.notifications.services import NotificationService
        from apps.accounts.models import CustomUser

        title = request.data.get('title', 'Announcement')
        body = request.data.get('body', '')
        roles = request.data.get('roles', ['USER', 'MERCHANT', 'RIDER'])

        users = CustomUser.objects.filter(role__in=roles, is_active=True)
        count = 0
        for u in users:
            NotificationService.send(u.id, u.role, 'system.broadcast', {'title': title, 'body': body})
            count += 1
        return Response({'sent_to': count})


# ═══════════════════════════════════════════════════════════════════
# FRAUD
# ═══════════════════════════════════════════════════════════════════
class AdminFraudFlagListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from apps.fraud.models import FraudFlag
        flags = FraudFlag.objects.filter(is_deleted=False)[:50]
        data = [{
            'id': str(f.id), 'flag_type': f.flag_type,
            'subject_role': f.subject_role, 'resolution': f.resolution,
            'created_at': f.created_at.isoformat(),
        } for f in flags]
        return Response(data)


class AdminFraudCaseListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from apps.fraud.models import InvestigationCase
        cases = InvestigationCase.objects.filter(is_deleted=False)[:50]
        data = [{
            'id': str(c.id), 'case_number': c.case_number,
            'priority': c.priority, 'status': c.status,
            'created_at': c.created_at.isoformat(),
        } for c in cases]
        return Response(data)


class AdminFraudCaseCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        from apps.fraud.services import FraudService
        case = FraudService.create_case(
            fraud_flag=None,
            subject_id=request.data['subject_id'],
            subject_role=request.data['subject_role'],
            title=request.data['title'],
            priority=request.data.get('priority', 'MEDIUM'),
            admin_profile=request.user.adminprofile,
        )
        return Response({'case_number': case.case_number}, status=status.HTTP_201_CREATED)


class AdminFraudBlacklistView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        from apps.fraud.services import FraudService
        entry = FraudService.blacklist(
            subject_id=request.data['subject_id'],
            subject_role=request.data['subject_role'],
            reason=request.data['reason'],
            admin_profile=request.user.adminprofile,
        )
        return Response({'id': str(entry.id)}, status=status.HTTP_201_CREATED)


# ═══════════════════════════════════════════════════════════════════
# REFERRALS
# ═══════════════════════════════════════════════════════════════════
class AdminReferralUserListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from apps.referrals.models import ReferralRecord
        records = ReferralRecord.objects.filter(
            referral_code__owner_role='USER', is_deleted=False,
        ).select_related('referral_code')[:50]
        data = [{
            'code': r.referral_code.code, 'referred_id': str(r.referred_id),
            'status': r.status, 'points_credited': r.points_credited,
        } for r in records]
        return Response(data)


class AdminReferralRiderListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from apps.referrals.models import ReferralRecord
        records = ReferralRecord.objects.filter(
            referral_code__owner_role='RIDER', is_deleted=False,
        ).select_related('referral_code')[:50]
        data = [{
            'code': r.referral_code.code, 'referred_id': str(r.referred_id),
            'status': r.status, 'points_credited': r.points_credited,
        } for r in records]
        return Response(data)


# ═══════════════════════════════════════════════════════════════════
# AUDIT HELPER
# ═══════════════════════════════════════════════════════════════════
def _log_audit(request, action, target_type='', target_id=None, before_data=None, after_data=None):
    from .models import AdminAuditLog
    AdminAuditLog.objects.create(
        admin_id=request.user.id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        before_data=before_data,
        after_data=after_data,
        ip_address=request.META.get('REMOTE_ADDR'),
    )
