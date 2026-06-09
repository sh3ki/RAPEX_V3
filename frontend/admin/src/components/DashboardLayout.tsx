'use client';

import { DashboardShell } from '@shared/components/layout';
import { useToast } from '@shared/components/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAdminRealtimeStore } from '@/store/realtimeStore';

interface NotificationMessage {
  id?: string;
  event_type?: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const registerNotification = useAdminRealtimeStore((state) => state.registerNotification);
  const markMerchantSubmissionNotified = useAdminRealtimeStore((state) => state.markMerchantSubmissionNotified);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const token = Cookies.get('access_token');
    if (!token) {
      return;
    }

    const wsBase = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001';
    const wsUrl = `${wsBase}/ws/notifications/?token=${encodeURIComponent(token)}`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as NotificationMessage;
        const shouldHandle = registerNotification(payload.id);
        if (!shouldHandle) {
          return;
        }

        const eventType = String(payload.event_type || '');
        const data = payload.data || {};

        if (eventType === 'merchant.onboarding_submitted') {
          const merchantId = String(data.merchant_id || '').trim();
          if (merchantId) {
            markMerchantSubmissionNotified(merchantId);
          }
        }

        if (
          eventType === 'merchant.registered' ||
          eventType === 'merchant.onboarding_submitted' ||
          eventType === 'merchant.onboarding_step_updated'
        ) {
          const merchantId = String(data.merchant_id || '').trim();
          void queryClient.invalidateQueries({ queryKey: ['admin-merchants'] });
          if (merchantId) {
            void queryClient.invalidateQueries({ queryKey: ['admin-merchant-details', merchantId] });
          }
          if (eventType !== 'merchant.onboarding_step_updated') {
            toast.info(payload.body || 'New merchant update received.', payload.title || 'Merchant Update');
            void queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
          }
        }
      } catch {
        // Ignore malformed realtime payloads and keep socket alive.
      }
    };

    return () => {
      socket.close();
    };
  }, [
    isAuthenticated,
    markMerchantSubmissionNotified,
    queryClient,
    registerNotification,
    toast,
  ]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardShell
      sidebarCollapsed={sidebarCollapsed}
      sidebar={<Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />}
      topbar={<TopBar />}
    >
      {children}
    </DashboardShell>
  );
}
