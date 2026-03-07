"""
RAPEX — Development Settings
"""
from .base import *  # noqa: F401, F403

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '*']

# Use console email backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# More verbose logging in development
LOGGING['loggers']['apps']['level'] = 'DEBUG'  # noqa: F405
LOGGING['loggers']['django']['level'] = 'DEBUG'  # noqa: F405

# Disable throttling in development
REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = []  # noqa: F405
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {}  # noqa: F405
