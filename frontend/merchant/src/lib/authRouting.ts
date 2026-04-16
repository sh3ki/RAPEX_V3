export const getPostLoginRoute = (user: any) => {
  if (!user) {
    return '/dashboard';
  }

  if (user.role === 'MERCHANT') {
    if (!user.wizard_completed) {
      return '/onboarding';
    }
    if (String(user.status || '').toUpperCase() === 'PENDING') {
      return '/pending';
    }
  }

  return '/dashboard';
};
