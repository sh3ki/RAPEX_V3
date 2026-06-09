"""RAPEX Admin Panel — Views"""
import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsAdmin, IsAdminOrSuperAdmin
from apps.core.storage import resolve_storage_url

logger = logging.getLogger(__name__)


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
        return Response(UserSerializer(user, context={'request': request}).data)


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


def _required_merchant_document_types(registration_type: str):
    required = {'SELFIE_WITH_ID', 'VALID_ID_FRONT', 'VALID_ID_BACK'}
    if registration_type == 'REGISTERED_NON_VAT':
        required.update({'BARANGAY_PERMIT', 'DTI_OR_SEC'})
    elif registration_type == 'REGISTERED_VAT':
        required.update({'BIR_2303', 'DTI_OR_SEC', 'MAYORS_PERMIT'})
    return required


def _merchant_onboarding_progress(merchant_profile):
    from apps.merchant.models import (
        MerchantBusinessProfile,
        MerchantDocument,
        MerchantLocation,
        MerchantOnboardingState,
    )

    user = merchant_profile.user
    profile_completed = bool(
        user.first_name and user.last_name and user.username and user.phone and user.email
    )

    business_profile = None
    location = None
    state = None
    try:
        business_profile = merchant_profile.business_profile
    except MerchantBusinessProfile.DoesNotExist:
        business_profile = None

    try:
        location = merchant_profile.onboarding_location
    except MerchantLocation.DoesNotExist:
        location = None

    try:
        state = merchant_profile.onboarding_state
    except MerchantOnboardingState.DoesNotExist:
        state = None

    business_completed = bool(
        business_profile
        and business_profile.business_name
        and business_profile.categories.filter(is_deleted=False, is_active=True).exists()
        and business_profile.business_types.filter(is_deleted=False, is_active=True).exists()
    )

    location_completed = bool(
        location
        and location.house_number
        and location.street_name
        and location.barangay
        and location.city_municipality
        and location.province
        and location.zip_code
        and location.latitude is not None
        and location.longitude is not None
    )

    registration_type = getattr(business_profile, 'registration_type', 'UNREGISTERED')
    required_doc_types = _required_merchant_document_types(registration_type)
    submitted_doc_types = set(
        MerchantDocument.objects.filter(merchant=merchant_profile, is_deleted=False)
        .values_list('document_type', flat=True)
    )

    # Keep compatibility for older records that used a single legacy VALID_ID type.
    if 'VALID_ID' in submitted_doc_types:
        submitted_doc_types.update({'VALID_ID_FRONT', 'VALID_ID_BACK'})

    documents_completed = required_doc_types.issubset(submitted_doc_types)

    verification_completed = bool(
        state
        and state.current_step >= 5
        and state.is_submitted
        and state.email_verified
        and state.phone_verified
        and state.terms_accepted
        and state.privacy_accepted
    )

    checklist = [
        {'key': 'profile', 'label': 'Profile', 'completed': profile_completed},
        {'key': 'business', 'label': 'Business', 'completed': business_completed},
        {'key': 'location', 'label': 'Location', 'completed': location_completed},
        {'key': 'documents', 'label': 'Documents', 'completed': documents_completed},
        {'key': 'verification', 'label': 'Verify & Submit', 'completed': verification_completed},
    ]
    completed_steps = sum(1 for item in checklist if item['completed'])
    total_steps = len(checklist)
    percentage = int((completed_steps / total_steps) * 100)

    return {
        'completed_steps': completed_steps,
        'total_steps': total_steps,
        'percentage': percentage,
        'can_review': completed_steps == total_steps,
        'checklist': checklist,
    }


def _resolve_media_url(request, value: str) -> str:
    return resolve_storage_url(value, request=request)


def _merchant_display_name_for_email(merchant_profile) -> str:
        user = merchant_profile.user
        if merchant_profile.business_name:
                return merchant_profile.business_name

        if merchant_profile.full_name:
                return merchant_profile.full_name

        full_name = f"{(user.first_name or '').strip()} {(user.last_name or '').strip()}".strip()
        return full_name or user.email or f"Merchant {user.id}"


def _send_merchant_kyc_status_email(merchant_profile, status_value: str, rejection_reason: str = '') -> None:
        user = merchant_profile.user
        recipient_email = (user.email or '').strip()
        if not recipient_email:
                return

        merchant_name = _merchant_display_name_for_email(merchant_profile)
        normalized_status = str(status_value or '').upper().strip()

        if normalized_status == 'APPROVED':
                subject = 'RAPEX Merchant KYC Approved'
                text_body = (
                        f"Dear {merchant_name},\n\n"
                        "Your merchant KYC verification status is now APPROVED.\n\n"
                        "Next steps:\n"
                        "1. Log in to your merchant dashboard.\n"
                        "2. Complete your store setup and product listings if needed.\n"
                        "3. Start receiving and managing orders in RAPEX.\n\n"
                        "Thank you for onboarding with RAPEX.\n"
                        "RAPEX Merchant Operations"
                )
                html_body = f"""
<!doctype html>
<html>
    <body style=\"margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;\">
        <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"padding:24px 12px;\">
            <tr>
                <td align=\"center\">
                    <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;\">
                        <tr>
                            <td style=\"padding:18px 22px;background:#0f172a;color:#ffffff;\">
                                <div style=\"font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.9;\">RAPEX</div>
                                <div style=\"margin-top:6px;font-size:20px;font-weight:700;\">Merchant KYC Approved</div>
                            </td>
                        </tr>
                        <tr>
                            <td style=\"padding:22px;\">
                                <p style=\"margin:0 0 10px 0;font-size:14px;line-height:1.6;\">Dear {merchant_name},</p>
                                <p style=\"margin:0 0 10px 0;font-size:14px;line-height:1.6;\">Your merchant KYC verification status is now <strong>APPROVED</strong>.</p>
                                <p style=\"margin:0 0 8px 0;font-size:14px;line-height:1.6;\">Next steps:</p>
                                <ol style=\"margin:0 0 10px 20px;padding:0;font-size:14px;line-height:1.6;\">
                                    <li>Log in to your merchant dashboard.</li>
                                    <li>Complete your store setup and product listings if needed.</li>
                                    <li>Start receiving and managing orders in RAPEX.</li>
                                </ol>
                                <p style=\"margin:0;font-size:13px;line-height:1.6;color:#475569;\">Thank you for onboarding with RAPEX.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>
""".strip()
        else:
                reason = (rejection_reason or '').strip() or 'No specific reason was provided by the review team.'
                subject = 'RAPEX Merchant KYC Rejected - Action Required'
                text_body = (
                        f"Dear {merchant_name},\n\n"
                        "Your merchant KYC verification status is now REJECTED.\n"
                        f"Reason: {reason}\n\n"
                        "Resubmission instructions:\n"
                        "1. Sign in to your merchant account.\n"
                        "2. Open the onboarding flow and update the flagged details/documents.\n"
                        "3. Re-submit your onboarding application for review.\n\n"
                        "If you need assistance, please contact RAPEX support.\n"
                        "RAPEX Merchant Operations"
                )
                html_body = f"""
<!doctype html>
<html>
    <body style=\"margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;\">
        <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"padding:24px 12px;\">
            <tr>
                <td align=\"center\">
                    <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;\">
                        <tr>
                            <td style=\"padding:18px 22px;background:#7f1d1d;color:#ffffff;\">
                                <div style=\"font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.9;\">RAPEX</div>
                                <div style=\"margin-top:6px;font-size:20px;font-weight:700;\">Merchant KYC Rejected</div>
                            </td>
                        </tr>
                        <tr>
                            <td style=\"padding:22px;\">
                                <p style=\"margin:0 0 10px 0;font-size:14px;line-height:1.6;\">Dear {merchant_name},</p>
                                <p style=\"margin:0 0 10px 0;font-size:14px;line-height:1.6;\">Your merchant KYC verification status is now <strong>REJECTED</strong>.</p>
                                <p style=\"margin:0 0 10px 0;font-size:14px;line-height:1.6;\"><strong>Reason:</strong> {reason}</p>
                                <p style=\"margin:0 0 8px 0;font-size:14px;line-height:1.6;\">Resubmission instructions:</p>
                                <ol style=\"margin:0 0 10px 20px;padding:0;font-size:14px;line-height:1.6;\">
                                    <li>Sign in to your merchant account.</li>
                                    <li>Open onboarding and update the flagged details/documents.</li>
                                    <li>Re-submit your onboarding application for review.</li>
                                </ol>
                                <p style=\"margin:0;font-size:13px;line-height:1.6;color:#475569;\">If you need assistance, contact RAPEX support.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>
""".strip()

        try:
                email_message = EmailMultiAlternatives(
                        subject=subject,
                        body=text_body,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        to=[recipient_email],
                )
                email_message.attach_alternative(html_body, 'text/html')
                email_message.send(fail_silently=False)
        except Exception:
                logger.exception(
                        'Failed to send merchant KYC status email.',
                        extra={
                                'merchant_user_id': str(user.id),
                                'status': normalized_status,
                        },
                )


def _merchant_onboarding_details_payload(request, merchant_profile):
    from apps.merchant.models import (
        MerchantBusinessProfile,
        MerchantDocument,
        MerchantLocation,
        MerchantOnboardingState,
    )

    user = merchant_profile.user

    business_profile = None
    location = None
    state = None
    try:
        business_profile = merchant_profile.business_profile
    except MerchantBusinessProfile.DoesNotExist:
        business_profile = None

    try:
        location = merchant_profile.onboarding_location
    except MerchantLocation.DoesNotExist:
        location = None

    try:
        state = merchant_profile.onboarding_state
    except MerchantOnboardingState.DoesNotExist:
        state = None

    profile_image_value = user.profile_image_url or user.avatar_url
    profile_image_url = _resolve_media_url(request, profile_image_value) if profile_image_value else ''

    documents = MerchantDocument.objects.filter(merchant=merchant_profile, is_deleted=False).order_by('created_at')
    image_only_types = {'SELFIE_WITH_ID', 'VALID_ID_FRONT', 'VALID_ID_BACK'}
    documents_payload = [
        {
            'id': str(document.id),
            'document_type': document.document_type,
            'label': document.get_document_type_display(),
            'file_url': _resolve_media_url(request, document.file_url),
            'is_optional': document.is_optional,
            'is_verified': document.is_verified,
            'rejection_reason': document.rejection_reason,
            'is_image': document.document_type in image_only_types,
        }
        for document in documents
    ]

    categories = []
    business_types = []
    if business_profile:
        categories = [item.name for item in business_profile.categories.filter(is_deleted=False, is_active=True)]
        business_types = [item.name for item in business_profile.business_types.filter(is_deleted=False, is_active=True)]

    return {
        'step1_profile': {
            'full_name': merchant_profile.full_name,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'phone': user.phone,
            'username': user.username,
            'profile_image_url': profile_image_url,
        },
        'step2_business': {
            'business_name': business_profile.business_name if business_profile else merchant_profile.business_name,
            'registration_type': business_profile.registration_type if business_profile else 'UNREGISTERED',
            'categories': categories,
            'business_types': business_types,
        },
        'step3_location': {
            'house_number': location.house_number if location else '',
            'street_name': location.street_name if location else '',
            'barangay': location.barangay if location else '',
            'city_municipality': location.city_municipality if location else '',
            'province': location.province if location else '',
            'zip_code': location.zip_code if location else '',
            'latitude': str(location.latitude) if location and location.latitude is not None else '',
            'longitude': str(location.longitude) if location and location.longitude is not None else '',
        },
        'step4_documents': documents_payload,
        'step5_verification': {
            'current_step': state.current_step if state else 0,
            'is_submitted': bool(state and state.is_submitted),
            'email_verified': bool(state and state.email_verified),
            'phone_verified': bool(state and state.phone_verified),
            'terms_accepted': bool(state and state.terms_accepted),
            'privacy_accepted': bool(state and state.privacy_accepted),
            'submitted_at': state.submitted_at.isoformat() if state and state.submitted_at else None,
        },
    }


def _merchant_shops_products_payload(merchant_profile):
    from apps.fresh_market.models import FreshMarketProduct
    from apps.merchant.models import MerchantStore
    from apps.preloved.models import PrelovedItem
    from apps.ready_to_eat.models import MenuItem
    from apps.shop.models import ShopProduct

    shops = MerchantStore.objects.filter(merchant=merchant_profile, is_deleted=False).order_by('created_at')
    shops_payload = [
        {
            'id': str(shop.id),
            'store_type': shop.store_type,
            'display_name': shop.display_name,
            'description': shop.description,
            'is_open': shop.is_open,
            'is_visible': shop.is_visible,
            'is_accepting_delivery': shop.is_accepting_delivery,
            'is_accepting_pickup': shop.is_accepting_pickup,
            'created_at': shop.created_at.isoformat() if shop.created_at else None,
        }
        for shop in shops
    ]

    products_payload = []

    for product in ShopProduct.objects.filter(store__merchant=merchant_profile, store__is_deleted=False, is_deleted=False).select_related('store'):
        products_payload.append(
            {
                'id': str(product.id),
                'name': product.name,
                'store_id': str(product.store_id),
                'store_name': product.store.display_name,
                'store_type': product.store.store_type,
                'product_group': 'SHOP',
                'price': str(product.final_price),
                'status': 'AVAILABLE' if product.is_available else 'UNAVAILABLE',
                'created_at': product.created_at.isoformat() if product.created_at else None,
            }
        )

    for product in FreshMarketProduct.objects.filter(store__merchant=merchant_profile, store__is_deleted=False, is_deleted=False).select_related('store'):
        products_payload.append(
            {
                'id': str(product.id),
                'name': product.name,
                'store_id': str(product.store_id),
                'store_name': product.store.display_name,
                'store_type': product.store.store_type,
                'product_group': 'FRESH_MARKET',
                'price': str(product.final_price),
                'status': 'AVAILABLE' if product.is_available else 'UNAVAILABLE',
                'created_at': product.created_at.isoformat() if product.created_at else None,
            }
        )

    menu_items = MenuItem.objects.filter(store__merchant=merchant_profile, store__is_deleted=False, is_deleted=False).select_related('store').prefetch_related('variants')
    for item in menu_items:
        active_variant = next((variant for variant in item.variants.all() if not variant.is_deleted), None)
        products_payload.append(
            {
                'id': str(item.id),
                'name': item.name,
                'store_id': str(item.store_id),
                'store_name': item.store.display_name,
                'store_type': item.store.store_type,
                'product_group': 'READY_TO_EAT',
                'price': str(active_variant.final_price) if active_variant else '',
                'status': 'AVAILABLE' if item.is_available and not item.is_sold_out else 'UNAVAILABLE',
                'created_at': item.created_at.isoformat() if item.created_at else None,
            }
        )

    for item in PrelovedItem.objects.filter(store__merchant=merchant_profile, store__is_deleted=False, is_deleted=False).select_related('store'):
        products_payload.append(
            {
                'id': str(item.id),
                'name': item.title,
                'store_id': str(item.store_id),
                'store_name': item.store.display_name,
                'store_type': item.store.store_type,
                'product_group': 'PRELOVED',
                'price': str(item.final_price),
                'status': item.availability_status,
                'created_at': item.created_at.isoformat() if item.created_at else None,
            }
        )

    products_payload.sort(key=lambda item: item.get('created_at') or '', reverse=True)

    return {'shops': shops_payload, 'products': products_payload}


# ═══════════════════════════════════════════════════════════════════
# MERCHANT MANAGEMENT
# ═══════════════════════════════════════════════════════════════════
class AdminMerchantListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from apps.accounts.models import MerchantProfile
        from apps.merchant.models import MerchantBusinessProfile
        merchants = MerchantProfile.objects.filter(is_deleted=False).select_related(
            'user',
            'business_profile',
        ).prefetch_related(
            'business_profile__categories',
            'business_profile__business_types',
        )
        search = request.query_params.get('search')
        if search:
            merchants = merchants.filter(
                Q(business_name__icontains=search) | Q(user__phone__icontains=search)
            )

        data = []
        for m in merchants[:50]:
            try:
                business_profile = m.business_profile
            except MerchantBusinessProfile.DoesNotExist:
                business_profile = None
            categories = [item.name for item in business_profile.categories.filter(is_deleted=False, is_active=True)] if business_profile else []
            business_types = [item.name for item in business_profile.business_types.filter(is_deleted=False, is_active=True)] if business_profile else []

            data.append({
                'id': str(m.user_id),
                'business_name': m.business_name,
                'kyc_status': m.kyc_status,
                'phone': m.user.phone,
                'profile_image_url': _resolve_media_url(request, m.user.profile_image_url or m.user.avatar_url),
                'merchant_name': m.full_name,
                'merchant_username': m.user.username,
                'merchant_email': m.user.email,
                'merchant_phone': m.user.phone,
                'registration_type': business_profile.registration_type if business_profile else 'UNREGISTERED',
                'registration_type_label': business_profile.get_registration_type_display() if business_profile else 'Unregistered',
                'business_categories': categories,
                'business_types': business_types,
                'onboarding_progress': _merchant_onboarding_progress(m),
            })

        return Response(data)


class AdminMerchantDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, pk):
        from apps.accounts.models import MerchantProfile

        merchant = MerchantProfile.objects.select_related('user').get(user_id=pk, is_deleted=False)

        return Response(
            {
                'id': str(merchant.user_id),
                'business_name': merchant.business_name,
                'full_name': merchant.full_name,
                'phone': merchant.user.phone,
                'email': merchant.user.email,
                'kyc_status': merchant.kyc_status,
                'onboarding_progress': _merchant_onboarding_progress(merchant),
                'onboarding_details': _merchant_onboarding_details_payload(request, merchant),
                **_merchant_shops_products_payload(merchant),
            }
        )


class AdminMerchantKYCApproveView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        from apps.accounts.models import MerchantProfile
        from apps.merchant.models import MerchantDocument, MerchantOnboardingState

        mp = MerchantProfile.objects.select_related('user').get(user_id=pk)
        progress = _merchant_onboarding_progress(mp)
        if not progress['can_review']:
            return Response(
                {
                    'message': 'Merchant onboarding is incomplete. Approve is only allowed after all 5 steps are completed.',
                    'onboarding_progress': progress,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            mp.kyc_status = 'APPROVED'
            mp.kyc_rejection_reason = ''
            mp.status = mp.AccountStatus.APPROVED
            mp.wizard_completed = True
            mp.resubmission_requested = False
            mp.save(
                update_fields=[
                    'kyc_status',
                    'kyc_rejection_reason',
                    'status',
                    'wizard_completed',
                    'resubmission_requested',
                    'updated_at',
                ]
            )

            user = mp.user
            user.status = user.AccountStatus.APPROVED
            user.wizard_completed = True
            user.save(update_fields=['status', 'wizard_completed', 'updated_at'])

            MerchantDocument.objects.filter(merchant=mp, is_deleted=False).update(
                is_verified=True,
                rejection_reason='',
                updated_at=timezone.now(),
            )

            state = MerchantOnboardingState.objects.filter(merchant=mp).first()
            if state:
                state.can_resubmit = False
                state.admin_resubmission_note = ''
                state.is_submitted = True
                state.save(update_fields=['can_resubmit', 'admin_resubmission_note', 'is_submitted', 'updated_at'])

        from apps.notifications.services import NotificationService
        NotificationService.send(mp.user_id, 'MERCHANT', 'kyc.approved')
        _send_merchant_kyc_status_email(mp, 'APPROVED')
        _log_audit(request, 'merchant_kyc_approve', 'MERCHANT', pk)
        return Response({'status': 'approved'})


class AdminMerchantKYCRejectView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        from apps.accounts.models import MerchantProfile
        from apps.merchant.models import MerchantDocument, MerchantOnboardingState

        note = str(request.data.get('note') or request.data.get('rejection_note') or '').strip()
        if not note:
            return Response(
                {'message': 'A rejection note is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        mp = MerchantProfile.objects.select_related('user').get(user_id=pk)
        progress = _merchant_onboarding_progress(mp)
        if not progress['can_review']:
            return Response(
                {
                    'message': 'Merchant onboarding is incomplete. Reject is only allowed after all 5 steps are completed.',
                    'onboarding_progress': progress,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            mp.kyc_status = 'REJECTED'
            mp.kyc_rejection_reason = note
            mp.status = mp.AccountStatus.REJECTED
            mp.resubmission_requested = True
            mp.save(
                update_fields=[
                    'kyc_status',
                    'kyc_rejection_reason',
                    'status',
                    'resubmission_requested',
                    'updated_at',
                ]
            )

            user = mp.user
            user.status = user.AccountStatus.PENDING
            user.wizard_completed = True
            user.save(update_fields=['status', 'wizard_completed', 'updated_at'])

            MerchantDocument.objects.filter(merchant=mp, is_deleted=False).update(
                is_verified=False,
                rejection_reason=note,
                updated_at=timezone.now(),
            )

            state, _ = MerchantOnboardingState.objects.get_or_create(merchant=mp)
            state.can_resubmit = True
            state.admin_resubmission_note = note
            state.is_submitted = False
            state.save(update_fields=['can_resubmit', 'admin_resubmission_note', 'is_submitted', 'updated_at'])

        from apps.notifications.services import NotificationService
        NotificationService.send(
            mp.user_id,
            'MERCHANT',
            'kyc.rejected',
            data={'admin_note': note, 'can_resubmit': True},
        )
        _send_merchant_kyc_status_email(mp, 'REJECTED', rejection_reason=note)
        _log_audit(
            request,
            'merchant_kyc_reject',
            'MERCHANT',
            pk,
            after_data={'admin_note': note, 'can_resubmit': True},
        )
        return Response({'status': 'rejected', 'note': note, 'can_resubmit': True})


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
