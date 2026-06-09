import { create } from 'zustand';

interface AdminRealtimeState {
  handledNotificationIds: string[];
  newMerchantSubmissionIds: string[];
  registerNotification: (notificationId?: string) => boolean;
  markMerchantSubmissionNotified: (merchantId: string) => void;
  clearMerchantSubmissionNotification: (merchantId: string) => void;
}

export const useAdminRealtimeStore = create<AdminRealtimeState>((set, get) => ({
  handledNotificationIds: [],
  newMerchantSubmissionIds: [],
  registerNotification: (notificationId) => {
    if (!notificationId) {
      return true;
    }

    const alreadyHandled = get().handledNotificationIds.includes(notificationId);
    if (alreadyHandled) {
      return false;
    }

    set((state) => ({
      handledNotificationIds: [...state.handledNotificationIds, notificationId].slice(-200),
    }));

    return true;
  },
  markMerchantSubmissionNotified: (merchantId) => {
    const normalizedId = String(merchantId || '').trim();
    if (!normalizedId) {
      return;
    }

    set((state) => {
      if (state.newMerchantSubmissionIds.includes(normalizedId)) {
        return state;
      }
      return {
        newMerchantSubmissionIds: [normalizedId, ...state.newMerchantSubmissionIds].slice(0, 200),
      };
    });
  },
  clearMerchantSubmissionNotification: (merchantId) => {
    const normalizedId = String(merchantId || '').trim();
    if (!normalizedId) {
      return;
    }

    set((state) => ({
      newMerchantSubmissionIds: state.newMerchantSubmissionIds.filter((id) => id !== normalizedId),
    }));
  },
}));
