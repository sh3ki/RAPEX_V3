export const AUTH_TEXT = {
  en: {
    accessWithGoogleOrEmail: 'Access your account with Google or email.',
    secureSignInLinkHint: 'Enter your email to receive a secure sign-in link or signup with Google.',
    magicLinkSent: 'Check your email for the sign-in link.',
    magicLinkFailed: 'Unable to send magic link. Please try again.',
    magicLinkVerifyFailed: 'Magic link verification failed. Request a new link.',
    googleFailed: 'Google sign-in failed.',
    googleRoleConflict: 'This Google account is already associated with another role.',
    identifierLabel: 'Email or Username',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    continueWithPassword: 'Continue with Password',
    continueWithEmail: 'Continue with Email Link',
    continueWithGoogle: 'Continue with Google',
    emailOnlyHint: 'Enter your email to receive a secure sign-in link or signup with Google.',
    legalReviewRequired: 'Legal review required',
  },
} as const;

export type AuthLocale = keyof typeof AUTH_TEXT;

export const authText = (locale: AuthLocale = 'en') => AUTH_TEXT[locale];
