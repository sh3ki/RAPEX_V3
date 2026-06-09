'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

function ConfirmModal({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{description}</p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PendingPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, setUser } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [canResubmit, setCanResubmit] = useState(false);
  const [adminResubmissionNote, setAdminResubmissionNote] = useState('');
  const [kycStatus, setKycStatus] = useState('PENDING');

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    const status = String(user?.status || '').toUpperCase();
    if (status !== 'PENDING') {
      if (!user?.wizard_completed) {
        router.replace('/onboarding');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [isAuthenticated, router, user?.status, user?.wizard_completed]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let active = true;

    const syncStatus = async () => {
      try {
        const [stateResp, profileResp] = await Promise.all([
          api.get('/merchant/onboarding/state/'),
          api.get('/auth/merchant/profile/'),
        ]);

        if (!active) {
          return;
        }

        const statePayload = stateResp.data || {};
        const onboardingState = statePayload.state || {};
        const accountPayload = statePayload.account || {};
        const profileUser = profileResp.data?.user;

        const resolvedStatus = String(profileUser?.status || accountPayload.status || user?.status || '').toUpperCase();
        const resolvedWizardCompleted = Boolean(
          profileUser?.wizard_completed ?? accountPayload.wizard_completed ?? user?.wizard_completed
        );
        const resolvedKycStatus = String(accountPayload.kyc_status || profileResp.data?.kyc_status || 'PENDING').toUpperCase();

        setCanResubmit(Boolean(onboardingState.can_resubmit));
        setAdminResubmissionNote(String(onboardingState.admin_resubmission_note || '').trim());
        setKycStatus(resolvedKycStatus);

        if (profileUser?.id) {
          const shouldUpdateUser =
            profileUser.status !== user?.status ||
            profileUser.wizard_completed !== user?.wizard_completed ||
            profileUser.first_name !== user?.first_name ||
            profileUser.last_name !== user?.last_name;

          if (shouldUpdateUser) {
            setUser(profileUser);
          }
        }

        const canUnlockDashboard = resolvedStatus !== 'PENDING' || resolvedKycStatus === 'APPROVED';

        if (canUnlockDashboard) {
          if (resolvedKycStatus === 'APPROVED' && profileUser?.id && resolvedStatus === 'PENDING') {
            setUser({
              ...profileUser,
              status: 'APPROVED',
              wizard_completed: true,
            });
          }

          if (!resolvedWizardCompleted) {
            router.replace('/onboarding');
          } else {
            router.replace('/dashboard');
          }
        }
      } catch {
        // Keep users on pending screen when sync fails.
      }
    };

    void syncStatus();
    const intervalId = window.setInterval(() => {
      void syncStatus();
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, router, setUser, user]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white px-4 py-10">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-amber-200 bg-white p-8 shadow-sm">
        <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          Account Status: Pending
        </span>

        <h1 className="mt-4 text-2xl font-bold text-gray-900">Your Merchant Application Is Under Review</h1>

        <p className="mt-3 text-sm leading-6 text-gray-700">
          Your setup is complete and has been submitted successfully. Our admin team is currently reviewing your information and documents.
        </p>

        {canResubmit ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold text-red-900">KYC Action Needed</p>
            <p className="mt-1">
              Your latest KYC submission was rejected. Please update your onboarding details and submit again for review.
            </p>
            {adminResubmissionNote ? (
              <p className="mt-2 rounded-lg bg-white px-3 py-2 text-red-800">
                <span className="font-semibold">Admin Note:</span> {adminResubmissionNote}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p className="font-semibold text-gray-900">What happens next?</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>You will receive a notification once your account is approved.</li>
            <li>KYC status: {kycStatus || 'PENDING'}.</li>
            <li>If additional details are needed, resubmission will be enabled by admin request.</li>
            <li>Dashboard access remains locked while your status is pending.</li>
          </ul>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {canResubmit ? (
            <button
              type="button"
              onClick={() => router.push('/onboarding')}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Go Back To Onboarding Wizard
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </div>

      <ConfirmModal
        open={showLogoutConfirm}
        title="Logout"
        description="Are you sure you want to logout while your merchant account is pending approval?"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
      />
    </div>
  );
}
