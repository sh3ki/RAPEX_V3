"""RAPEX Wallet Module — Serializers"""
from rest_framework import serializers
from .models import (
    RapexWallet, WalletTransaction, RiderRemittanceRecord,
    UserLoyaltyPoints, PointsTransaction,
)


class RapexWalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = RapexWallet
        fields = ['id', 'owner_id', 'owner_type', 'balance', 'updated_at']


class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = [
            'id', 'transaction_type', 'amount', 'balance_after',
            'order_id', 'reference_number', 'note',
            'performed_by_id', 'performed_by_role', 'created_at',
        ]


class RiderRemittanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiderRemittanceRecord
        fields = [
            'id', 'rider', 'period_start', 'period_end',
            'amount_owed', 'amount_paid', 'due_date', 'status',
            'paid_at', 'payment_reference',
        ]


class UserLoyaltyPointsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserLoyaltyPoints
        fields = ['total_points', 'rollover_balance', 'lifetime_earned']


class PointsTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PointsTransaction
        fields = ['id', 'transaction_type', 'points', 'order_id', 'note', 'created_at']
