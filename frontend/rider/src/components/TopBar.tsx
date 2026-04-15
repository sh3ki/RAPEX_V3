'use client';

import { TopBar as SharedTopBar } from '@shared/components/layout';
import { useAuthStore } from '@/store/authStore';

export default function TopBar() {
  const { user } = useAuthStore();
  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'RD';

  return <SharedTopBar initials={initials} />;
}
