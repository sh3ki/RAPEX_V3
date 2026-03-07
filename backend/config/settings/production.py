"""
RAPEX — Production Settings
"""
from .base import *  # noqa: F401, F403

DEBUG = False

# Security
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Production logging - INFO level only
LOGGING['loggers']['apps']['level'] = 'INFO'  # noqa: F405
LOGGING['loggers']['django']['level'] = 'WARNING'  # noqa: F405
