"""
RAPEX Core — Custom Exception Classes
All API errors use these for consistent error formatting.
"""
from rest_framework import status
from rest_framework.exceptions import APIException


class RapexAPIException(APIException):
    """Base exception for all RAPEX API errors."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'An error occurred.'
    default_code = 'error'

    def __init__(self, detail=None, code=None, status_code=None):
        if detail is not None:
            self.detail = detail
        else:
            self.detail = self.default_detail
        if code is not None:
            self.default_code = code
        if status_code is not None:
            self.status_code = status_code
        super().__init__(detail=self.detail, code=self.default_code)


class InsufficientBalanceError(RapexAPIException):
    status_code = 402
    default_detail = 'Insufficient wallet balance to complete this transaction.'
    default_code = 'insufficient_balance'


class OrderNotCancellable(RapexAPIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'This order can no longer be cancelled.'
    default_code = 'order_not_cancellable'


class StoreCurrentlyClosed(RapexAPIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'This store is currently closed.'
    default_code = 'store_closed'


class KYCNotApproved(RapexAPIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'KYC verification is required before performing this action.'
    default_code = 'kyc_required'


class RiderOffline(RapexAPIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Rider is currently offline.'
    default_code = 'rider_offline'


class InvalidOTP(RapexAPIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'The OTP code is invalid.'
    default_code = 'invalid_otp'


class OTPExpired(RapexAPIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'The OTP code has expired. Please request a new one.'
    default_code = 'otp_expired'


class OTPRateLimitExceeded(RapexAPIException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = 'Too many OTP attempts. Please wait 15 minutes before trying again.'
    default_code = 'otp_rate_limit'


class GPSValidationFailed(RapexAPIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'You must be within 50 meters of the delivery address to confirm delivery.'
    default_code = 'gps_validation_failed'


class MaxStoresReached(RapexAPIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'You have reached the maximum number of stores (4).'
    default_code = 'max_stores_reached'
