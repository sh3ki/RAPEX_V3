"""
RAPEX Core — Constants
Shared constants and enum choices used across all modules.
"""


class Roles:
    SUPERADMIN = 'SUPERADMIN'
    ADMIN = 'ADMIN'
    MERCHANT = 'MERCHANT'
    RIDER = 'RIDER'
    USER = 'USER'

    CHOICES = [
        (SUPERADMIN, 'Super Admin'),
        (ADMIN, 'Admin'),
        (MERCHANT, 'Merchant'),
        (RIDER, 'Rider'),
        (USER, 'User'),
    ]


class StoreTypes:
    SHOP = 'SHOP'
    FRESH_MARKET = 'FRESH_MARKET'
    READY_TO_EAT = 'READY_TO_EAT'
    PRELOVED = 'PRELOVED'

    CHOICES = [
        (SHOP, 'Shop'),
        (FRESH_MARKET, 'Fresh Market'),
        (READY_TO_EAT, 'Ready to Eat'),
        (PRELOVED, 'Pre-Loved'),
    ]


class KYCStatuses:
    PENDING = 'PENDING'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'

    CHOICES = [
        (PENDING, 'Pending'),
        (APPROVED, 'Approved'),
        (REJECTED, 'Rejected'),
    ]


class OrderStatuses:
    PENDING_MERCHANT = 'PENDING_MERCHANT'
    MERCHANT_ACCEPTED = 'MERCHANT_ACCEPTED'
    PREPARING = 'PREPARING'
    COOKING = 'COOKING'
    FOR_PICKUP = 'FOR_PICKUP'
    READY_FOR_PICKUP = 'READY_FOR_PICKUP'
    RIDER_ASSIGNED = 'RIDER_ASSIGNED'
    PICKED_UP = 'PICKED_UP'
    IN_TRANSIT = 'IN_TRANSIT'
    DELIVERED = 'DELIVERED'
    CANCELLED = 'CANCELLED'
    TIMEOUT_CANCELLED = 'TIMEOUT_CANCELLED'
    FAILED = 'FAILED'

    CHOICES = [
        (PENDING_MERCHANT, 'Pending Merchant'),
        (MERCHANT_ACCEPTED, 'Merchant Accepted'),
        (PREPARING, 'Preparing'),
        (COOKING, 'Cooking'),
        (FOR_PICKUP, 'For Pickup'),
        (READY_FOR_PICKUP, 'Ready for Pickup'),
        (RIDER_ASSIGNED, 'Rider Assigned'),
        (PICKED_UP, 'Picked Up'),
        (IN_TRANSIT, 'In Transit'),
        (DELIVERED, 'Delivered'),
        (CANCELLED, 'Cancelled'),
        (TIMEOUT_CANCELLED, 'Timeout Cancelled'),
        (FAILED, 'Failed'),
    ]

    TERMINAL_STATES = {DELIVERED, CANCELLED, TIMEOUT_CANCELLED, FAILED}
    CANCELLABLE_STATES = {PENDING_MERCHANT, MERCHANT_ACCEPTED}

    # Valid state transitions
    VALID_TRANSITIONS = {
        PENDING_MERCHANT: {MERCHANT_ACCEPTED, TIMEOUT_CANCELLED, CANCELLED},
        MERCHANT_ACCEPTED: {PREPARING, COOKING},
        PREPARING: {FOR_PICKUP, RIDER_ASSIGNED},
        COOKING: {READY_FOR_PICKUP, RIDER_ASSIGNED},
        FOR_PICKUP: {PICKED_UP},
        READY_FOR_PICKUP: {PICKED_UP},
        RIDER_ASSIGNED: {PICKED_UP},
        PICKED_UP: {IN_TRANSIT},
        IN_TRANSIT: {DELIVERED, FAILED},
    }


class VehicleTypes:
    BICYCLE = 'BICYCLE'
    MOTORCYCLE = 'MOTORCYCLE'
    FOUR_WHEELS = '4_WHEELS'

    CHOICES = [
        (BICYCLE, 'Bicycle'),
        (MOTORCYCLE, 'Motorcycle'),
        (FOUR_WHEELS, '4-Wheels'),
    ]


class WalletTransactionTypes:
    INITIAL_LOAD = 'INITIAL_LOAD'
    TOP_UP = 'TOP_UP'
    PAYMENT_TO_MERCHANT = 'PAYMENT_TO_MERCHANT'
    COMMISSION_DEDUCTION = 'COMMISSION_DEDUCTION'
    PENALTY_DEDUCTION = 'PENALTY_DEDUCTION'
    INCENTIVE_BONUS = 'INCENTIVE_BONUS'
    REFERRAL_CREDIT = 'REFERRAL_CREDIT'
    POINTS_REDEMPTION = 'POINTS_REDEMPTION'
    ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT'
    REMITTANCE_COLLECTION = 'REMITTANCE_COLLECTION'

    CHOICES = [
        (INITIAL_LOAD, 'Initial Load'),
        (TOP_UP, 'Top Up'),
        (PAYMENT_TO_MERCHANT, 'Payment to Merchant'),
        (COMMISSION_DEDUCTION, 'Commission Deduction'),
        (PENALTY_DEDUCTION, 'Penalty Deduction'),
        (INCENTIVE_BONUS, 'Incentive Bonus'),
        (REFERRAL_CREDIT, 'Referral Credit'),
        (POINTS_REDEMPTION, 'Points Redemption'),
        (ADMIN_ADJUSTMENT, 'Admin Adjustment'),
        (REMITTANCE_COLLECTION, 'Remittance Collection'),
    ]
