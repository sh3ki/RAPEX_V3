"""RAPEX Core — Localization registry.

English is currently the active locale, but all user-facing messages should resolve
through this centralized mapping to keep API and frontend copies consistent.
"""

from __future__ import annotations


DEFAULT_LOCALE = 'en'


MESSAGES = {
    'en': {
        'auth.google.role_conflict': 'This Google account is already associated with another role.',
        'auth.google.account_created': 'Account created successfully via Google.',
        'auth.google.login_success': 'Signed in with Google successfully.',
        'auth.magic_link.sent': 'Magic login link sent to your email.',
        'auth.magic_link.invalid': 'This magic link is invalid or has expired.',
        'auth.magic_link.login_success': 'Signed in via magic link successfully.',
        'auth.magic_link.signup_only': 'Magic-link signup is only available for emails that do not have an account yet.',
        'auth.password.disabled': 'Password login is disabled. Please continue with Google or email magic link.',
        'auth.password.invalid': 'Invalid credentials. Please check your email or username and password.',
        'auth.password.login_success': 'Signed in with password successfully.',
        'auth.account.inactive': 'Account is deactivated.',
        'auth.signup_required': 'No account is linked to this Google email. Please continue with email magic link or Google signup.',
    }
}


def tr(key: str, locale: str | None = None) -> str:
    language = locale or DEFAULT_LOCALE
    messages = MESSAGES.get(language, MESSAGES[DEFAULT_LOCALE])
    return messages.get(key, key)
