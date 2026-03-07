"""RAPEX Referrals Module — Views"""
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsRider, IsUser

from .models import ReferralRecord
from .services import ReferralService


class UserReferralView(APIView):
    """GET /api/v1/user/referral/ — Get referral code & stats."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        code = ReferralService.get_or_create_code(request.user)
        records = ReferralRecord.objects.filter(referral_code=code)
        return Response({
            'code': code.code,
            'qr_code_url': code.qr_code_url,
            'total_used': code.total_used,
            'records': [{
                'referred_id': str(r.referred_id),
                'status': r.status,
                'points_credited': r.points_credited,
                'created_at': r.created_at.isoformat(),
            } for r in records[:20]],
        })
