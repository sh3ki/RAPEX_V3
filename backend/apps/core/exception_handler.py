"""
RAPEX Core — Custom Exception Handler
Routes all DRF exceptions through the RapexJSONRenderer format.
"""
import logging

from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that formats all errors consistently.
    Never exposes raw tracebacks to clients.
    """
    response = exception_handler(exc, context)

    if response is not None:
        if isinstance(exc, ValidationError):
            response.data = {
                'detail': 'Validation error.',
                'errors': response.data,
            }
        elif isinstance(exc, APIException):
            response.data = {
                'detail': str(exc.detail) if hasattr(exc, 'detail') else 'An error occurred.',
                'code': getattr(exc, 'default_code', 'error'),
            }
    else:
        # Unhandled exception — log it, return generic 500
        logger.exception(f"Unhandled exception in {context.get('view', 'unknown')}: {exc}")
        from rest_framework.response import Response
        response = Response(
            {
                'detail': 'An internal server error occurred.',
                'code': 'server_error',
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response
