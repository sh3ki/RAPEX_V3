export const AUTH_TEXT = {
  en: {
    magicLinkSent: 'Check your email for the sign-in link.',
    magicLinkFailed: 'Unable to send magic link. Please try again.',
    magicLinkVerifyFailed: 'Magic link verification failed. Request a new link.',
    googleFailed: 'Google sign-in failed.',
    googleRoleConflict: 'This Google account is already associated with another role.',
    emailLabel: 'Email Address',
    continueWithEmail: 'Continue with Email Link',
    continueWithGoogle: 'Continue with Google',
    emailOnlyHint: 'We will send a secure sign-in link to your email.',
    legalReviewRequired: 'Legal review required',
  },
} as const;

export type AuthLocale = keyof typeof AUTH_TEXT;

export const authText = (locale: AuthLocale = 'en') => AUTH_TEXT[locale];
