'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

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
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p className="font-semibold text-gray-900">What happens next?</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>You will receive a notification once your account is approved.</li>
            <li>If additional details are needed, resubmission will be enabled by admin request.</li>
            <li>Dashboard access remains locked while your status is pending.</li>
          </ul>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
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
