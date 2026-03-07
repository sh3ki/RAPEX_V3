"""RAPEX Wallet Module — Models"""
from django.db import models
from apps.core.models import BaseModel


class RapexWallet(BaseModel):
    class OwnerType(models.TextChoices):
        RIDER = 'RIDER', 'Rider'
        USER = 'USER', 'User'

    owner_id = models.UUIDField()
    owner_type = models.CharField(max_length=10, choices=OwnerType.choices)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        db_table = 'rapex_wallets'
        unique_together = ['owner_id', 'owner_type']

    def __str__(self):
        return f"{self.owner_type} Wallet ({self.owner_id}) — ₱{self.balance}"


class WalletTransaction(BaseModel):
    class TransactionType(models.TextChoices):
        TOP_UP = 'TOP_UP', 'Top Up'
        PAYMENT_TO_MERCHANT = 'PAYMENT_TO_MERCHANT', 'Payment to Merchant'
        DELIVERY_FEE_EARNED = 'DELIVERY_FEE_EARNED', 'Delivery Fee Earned'
        COMMISSION_DEDUCTED = 'COMMISSION_DEDUCTED', 'Commission Deducted'
        INITIAL_LOAD = 'INITIAL_LOAD', 'Initial Load'
        REMITTANCE_DEDUCTED = 'REMITTANCE_DEDUCTED', 'Remittance Deducted'
        PENALTY = 'PENALTY', 'Penalty'
        INCENTIVE = 'INCENTIVE', 'Incentive'
        REFUND = 'REFUND', 'Refund'
        POINTS_REDEEMED = 'POINTS_REDEEMED', 'Points Redeemed'
        ADJUSTMENT = 'ADJUSTMENT', 'Adjustment'

    wallet = models.ForeignKey(RapexWallet, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=30, choices=TransactionType.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2, help_text='Positive=credit, Negative=debit')
    balance_after = models.DecimalField(max_digits=12, decimal_places=2)
    order_id = models.UUIDField(null=True, blank=True)
    reference_number = models.CharField(max_length=100, null=True, blank=True)
    note = models.TextField(null=True, blank=True)
    performed_by_id = models.UUIDField(null=True, blank=True)
    performed_by_role = models.CharField(max_length=20, choices=[
        ('SYSTEM', 'System'), ('ADMIN', 'Admin'), ('SUPERADMIN', 'SuperAdmin'),
    ], null=True, blank=True)

    class Meta:
        db_table = 'wallet_transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.transaction_type} ₱{self.amount} → ₱{self.balance_after}"


class RiderRemittanceRecord(BaseModel):
    class Status(models.TextChoices):
        CURRENT = 'CURRENT', 'Current'
        DUE_SOON = 'DUE_SOON', 'Due Soon'
        OVERDUE = 'OVERDUE', 'Overdue'
        PAID = 'PAID', 'Paid'
        WAIVED = 'WAIVED', 'Waived'

    rider = models.ForeignKey('accounts.RiderProfile', on_delete=models.CASCADE, related_name='remittance_records')
    period_start = models.DateField()
    period_end = models.DateField()
    amount_owed = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CURRENT)
    paid_at = models.DateTimeField(null=True, blank=True)
    payment_reference = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = 'rider_remittance_records'
        ordering = ['-period_start']

    def __str__(self):
        return f"Rider {self.rider_id}: {self.period_start}–{self.period_end} (₱{self.amount_owed})"


class UserLoyaltyPoints(BaseModel):
    user = models.OneToOneField('accounts.CustomUser', on_delete=models.CASCADE, related_name='loyalty_points')
    total_points = models.IntegerField(default=0)
    rollover_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    lifetime_earned = models.IntegerField(default=0)

    class Meta:
        db_table = 'user_loyalty_points'

    def __str__(self):
        return f"{self.user.phone}: {self.total_points} pts"


class PointsTransaction(BaseModel):
    class TransactionType(models.TextChoices):
        EARNED = 'EARNED', 'Earned'
        REDEEMED = 'REDEEMED', 'Redeemed'
        ADJUSTED = 'ADJUSTED', 'Adjusted'
        EXPIRED = 'EXPIRED', 'Expired'

    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='points_transactions')
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices)
    points = models.IntegerField()
    order_id = models.UUIDField(null=True, blank=True)
    note = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'points_transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.transaction_type}: {self.points} pts"

