'use client';

import { BriefcaseBusiness, Camera, CheckCircle2, FileText, Loader2, LogOut, MapPin, ShieldCheck, UserRound } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  Button,
  Checkbox,
  ConfirmPasswordInput,
  Dropdown,
  FileUpload,
  Input,
  MapPickerModal,
  MultiSelectDropdown,
  PasswordInput,
  PhoneNumberInput,
  ProfileImageUpload,
  useToast,
  Wizard,
} from '@shared/components/ui';

interface BusinessCategory {
  id: string;
  name: string;
}

interface BusinessType {
  id: string;
  name: string;
  category_id: string;
}

interface CountryCodeOption {
  id: string;
  country_name: string;
  country_code: string;
  country_flag_emoji: string;
  max_digits: number;
  is_default: boolean;
}

interface DocumentItem {
  document_type: string;
  file_url: string;
  is_optional: boolean;
}

type RegistrationType = 'UNREGISTERED' | 'REGISTERED_NON_VAT' | 'REGISTERED_VAT';

interface OnboardingState {
  profile: {
    profile_image_url: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    username: string;
    phone_number: string;
    password: string;
    confirm_password: string;
  };
  business: {
    business_name: string;
    registration_type: RegistrationType;
    category_ids: string[];
    business_type_ids: string[];
  };
  location: {
    house_number: string;
    street_name: string;
    barangay: string;
    city_municipality: string;
    province: string;
    zip_code: string;
    latitude: string;
    longitude: string;
  };
  documents: {
    selfie_with_id: string;
    items: DocumentItem[];
  };
  verification: {
    email_otp: string;
    phone_otp: string;
    terms_accepted: boolean;
    privacy_accepted: boolean;
  };
}

interface OnboardingFieldErrors {
  profile: Partial<Record<'first_name' | 'last_name' | 'email' | 'username' | 'phone_number' | 'password' | 'confirm_password', string>>;
  business: Partial<Record<'business_name' | 'category_ids' | 'business_type_ids' | 'registration_type', string>>;
  location: Partial<Record<'house_number' | 'street_name' | 'barangay' | 'city_municipality' | 'province' | 'zip_code' | 'latitude' | 'longitude', string>>;
  documents: Partial<Record<'selfie_with_id', string>>;
  verification: Partial<Record<'email_otp' | 'phone_otp' | 'terms_accepted' | 'privacy_accepted', string>>;
}

declare global {
  interface Window {
    FaceDetector?: any;
  }
}

const STORAGE_KEY = 'merchant_onboarding_draft';
const MAP_PROVIDER = process.env.NEXT_PUBLIC_MAP_PROVIDER || 'leaflet';

const DEFAULT_PHONE_COUNTRY: CountryCodeOption = {
  id: 'default-ph',
  country_name: 'Philippines',
  country_code: '+63',
  country_flag_emoji: 'PH',
  max_digits: 10,
  is_default: true,
};

const isStrongPassword = (value: string) => {
  return value.length >= 8 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value);
};

const asSafeString = (value: unknown) => (typeof value === 'string' ? value : '');

const initialState: OnboardingState = {
  profile: {
    profile_image_url: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    username: '',
    phone_number: '',
    password: '',
    confirm_password: '',
  },
  business: {
    business_name: '',
    registration_type: 'UNREGISTERED',
    category_ids: [],
    business_type_ids: [],
  },
  location: {
    house_number: '',
    street_name: '',
    barangay: '',
    city_municipality: '',
    province: '',
    zip_code: '',
    latitude: '',
    longitude: '',
  },
  documents: {
    selfie_with_id: '',
    items: [],
  },
  verification: {
    email_otp: '',
    phone_otp: '',
    terms_accepted: false,
    privacy_accepted: false,
  },
};

const emptyFieldErrors: OnboardingFieldErrors = {
  profile: {},
  business: {},
  location: {},
  documents: {},
  verification: {},
};

const steps = [
  { id: 'profile', title: 'Profile', icon: <UserRound size={15} /> },
  { id: 'business', title: 'Business', icon: <BriefcaseBusiness size={15} /> },
  { id: 'location', title: 'Location', icon: <MapPin size={15} /> },
  { id: 'documents', title: 'Documents', icon: <FileText size={15} /> },
  { id: 'verify', title: 'Verify & Submit', icon: <ShieldCheck size={15} /> },
];

const documentMatrix: Record<RegistrationType, Array<{ type: string; label: string; required: boolean }>> = {
  UNREGISTERED: [
    { type: 'SELFIE_WITH_ID', label: 'Selfie with ID', required: true },
    { type: 'VALID_ID', label: 'Valid ID', required: true },
  ],
  REGISTERED_NON_VAT: [
    { type: 'SELFIE_WITH_ID', label: 'Selfie with ID', required: true },
    { type: 'VALID_ID', label: 'Valid ID', required: true },
    { type: 'BARANGAY_PERMIT', label: 'Barangay Permit', required: true },
    { type: 'DTI_OR_SEC', label: 'DTI or SEC Certificate', required: true },
    { type: 'BIR_2303', label: 'BIR Form 2303', required: false },
    { type: 'MAYORS_PERMIT', label: "Mayor's Permit", required: false },
    { type: 'OTHER', label: 'Other Documents', required: false },
  ],
  REGISTERED_VAT: [
    { type: 'SELFIE_WITH_ID', label: 'Selfie with ID', required: true },
    { type: 'VALID_ID', label: 'Valid ID', required: true },
    { type: 'BIR_2303', label: 'BIR Form 2303', required: true },
    { type: 'DTI_OR_SEC', label: 'DTI or SEC Certificate', required: true },
    { type: 'MAYORS_PERMIT', label: "Mayor's Permit", required: true },
    { type: 'OTHER', label: 'Other Documents', required: false },
  ],
};

function getPhoneMaxDigits(countryCode: string, countryCodes: CountryCodeOption[]): number {
  return countryCodes.find((option) => option.country_code === countryCode)?.max_digits || DEFAULT_PHONE_COUNTRY.max_digits;
}

function splitPhoneNumber(phoneNumber: string, countryCodes: CountryCodeOption[]) {
  const normalized = asSafeString(phoneNumber);
  const sortedCodes = [...countryCodes].sort((a, b) => b.country_code.length - a.country_code.length);
  const fallback = countryCodes.find((country) => country.is_default) || countryCodes[0] || DEFAULT_PHONE_COUNTRY;

  for (const country of sortedCodes) {
    if (normalized.startsWith(country.country_code)) {
      return {
        countryCode: country.country_code,
        localNumber: normalized.slice(country.country_code.length).replace(/[^0-9]/g, '').slice(0, country.max_digits),
      };
    }
  }

  return {
    countryCode: fallback.country_code,
    localNumber: normalized.replace(/[^0-9]/g, '').slice(0, fallback.max_digits),
  };
}

function profileInitials(firstName: string, lastName: string) {
  const first = firstName.trim().charAt(0);
  const last = lastName.trim().charAt(0);
  const joined = `${first}${last}`.trim();
  return joined ? joined.toUpperCase() : 'M';
}

function countryShortCode(countryName: string, countryFlagEmoji: string) {
  const flagValue = asSafeString(countryFlagEmoji).trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(flagValue)) {
    return flagValue;
  }

  const words = asSafeString(countryName).match(/[A-Za-z]+/g) || [];
  if (words.length >= 2) {
    const firstWord = words[0] || '';
    const secondWord = words[1] || '';
    return `${firstWord.charAt(0)}${secondWord.charAt(0)}`.toUpperCase();
  }
  if (words.length === 1) {
    const firstWord = words[0] || '';
    return firstWord.slice(0, 2).toUpperCase();
  }
  return 'NA';
}

function normalizeCoordinate(value: string | number): string {
  const normalized = typeof value === 'number' ? value : Number(asSafeString(value).trim());
  if (!Number.isFinite(normalized)) {
    return '';
  }

  const fixed = normalized.toFixed(8);
  return fixed.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="max-h-[70vh] overflow-auto p-4 text-sm text-slate-700 whitespace-pre-wrap">{children}</div>
      </div>
    </div>
  );
}

function SelfieCapture({
  value,
  onCapture,
}: {
  value: string;
  onCapture: (dataUrl: string, faceDetected: boolean) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [supportsFaceDetector, setSupportsFaceDetector] = useState(false);
  const [faceBox, setFaceBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: number | null = null;

    const boot = async () => {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      if (window.FaceDetector) {
        setSupportsFaceDetector(true);
        const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
        timer = window.setInterval(async () => {
          if (!videoRef.current) {
            return;
          }
          try {
            const faces = await detector.detect(videoRef.current);
            if (faces.length > 0) {
              const box = faces[0].boundingBox;
              setFaceDetected(true);
              setFaceBox({ x: box.x, y: box.y, width: box.width, height: box.height });
            } else {
              setFaceDetected(false);
              setFaceBox(null);
            }
          } catch {
            setFaceDetected(false);
          }
        }, 900);
      }
    };

    void boot();

    return () => {
      if (timer) {
        window.clearInterval(timer);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onCapture(dataUrl, supportsFaceDetector ? faceDetected : true);
  };

  return (
    <div className="space-y-3">
      <div className="relative w-full overflow-hidden rounded-xl border border-slate-300 bg-black">
        <video ref={videoRef} autoPlay playsInline muted className="h-[280px] w-full object-cover" />
        {faceBox ? (
          <div
            className="absolute border-2 border-emerald-400"
            style={{
              left: `${(faceBox.x / (videoRef.current?.videoWidth || 1)) * 100}%`,
              top: `${(faceBox.y / (videoRef.current?.videoHeight || 1)) * 100}%`,
              width: `${(faceBox.width / (videoRef.current?.videoWidth || 1)) * 100}%`,
              height: `${(faceBox.height / (videoRef.current?.videoHeight || 1)) * 100}%`,
            }}
          />
        ) : null}
      </div>

      <p className="text-xs text-slate-500">
        {supportsFaceDetector
          ? faceDetected
            ? 'Face detected. Capture is enabled.'
            : 'No face detected yet. Center your face and ID in frame.'
          : 'Face detection is not supported in this browser. Capture-only fallback is active.'}
      </p>

      <Button type="button" onClick={capture}>
        <Camera size={16} />
        Capture Selfie with ID
      </Button>

      {value ? <img src={value} alt="Selfie with ID" className="h-40 rounded-xl border border-slate-300 object-cover" /> : null}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default function MerchantOnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const toast = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [formState, setFormState] = useState<OnboardingState>(initialState);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [countryCodes, setCountryCodes] = useState<CountryCodeOption[]>([DEFAULT_PHONE_COUNTRY]);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<OnboardingFieldErrors>(emptyFieldErrors);
  const [usernameAvailability, setUsernameAvailability] = useState<'unknown' | 'checking' | 'available' | 'taken'>('unknown');
  const [showMap, setShowMap] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [selfieFaceValid, setSelfieFaceValid] = useState(false);
  const [uploadingDocTypes, setUploadingDocTypes] = useState<string[]>([]);
  const [profileImageUploading, setProfileImageUploading] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState('');
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [documentPickerFiles, setDocumentPickerFiles] = useState<Record<string, File[]>>({});
  const [phoneCountryCode, setPhoneCountryCode] = useState(DEFAULT_PHONE_COUNTRY.country_code);
  const [phoneLocalNumber, setPhoneLocalNumber] = useState('');
  const [termsText, setTermsText] = useState('Loading terms...');
  const [privacyText, setPrivacyText] = useState('Loading privacy...');
  const passwordSnapshotRef = useRef({ password: '', confirmPassword: '' });

  const stepDocuments = useMemo(() => documentMatrix[formState.business.registration_type], [formState.business.registration_type]);
  const isGoogleLinked = useMemo(() => hasHydrated && Boolean(user?.google_id), [hasHydrated, user]);
  const passwordStrong = useMemo(() => isStrongPassword(formState.profile.password), [formState.profile.password]);

  const categoryOptions = useMemo(
    () => categories.map((item) => ({ value: item.id, label: item.name })),
    [categories],
  );
  const businessTypeOptions = useMemo(
    () =>
      businessTypes.map((item) => ({
        value: item.id,
        label: item.name,
      })),
    [businessTypes],
  );
  const countryCodeOptions = useMemo(
    () =>
      countryCodes.map((country) => ({
        value: country.country_code,
        label: `${country.country_name} (${country.country_code})`,
        countryName: country.country_name,
        flag: country.country_flag_emoji || countryShortCode(country.country_name, country.country_flag_emoji),
        shortCode: countryShortCode(country.country_name, country.country_flag_emoji),
        maxDigits: country.max_digits,
        isDefault: country.is_default,
      })),
    [countryCodes],
  );

  const handleLogout = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
    logout();
  }, [logout]);

  const persistDraft = useCallback((nextState: OnboardingState) => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    }
  }, []);

  const patchState = useCallback((patch: Partial<OnboardingState>) => {
    setFormState((prev) => {
      const merged = { ...prev, ...patch };
      if (Object.keys(patch).every((key) => Object.is(prev[key as keyof OnboardingState], merged[key as keyof OnboardingState]))) {
        return prev;
      }
      persistDraft(merged);
      return merged;
    });
  }, [persistDraft]);

  const patchNested = useCallback(<K extends keyof OnboardingState>(key: K, patch: Partial<OnboardingState[K]>) => {
    setFormState((prev) => {
      const currentValue = prev[key] as Record<string, unknown>;
      const patchEntries = Object.entries(patch as Record<string, unknown>);
      const hasChanges = patchEntries.some(([entryKey, entryValue]) => !Object.is(currentValue[entryKey], entryValue));

      if (!hasChanges) {
        return prev;
      }

      const merged = {
        ...prev,
        [key]: { ...prev[key], ...patch },
      };
      persistDraft(merged);
      return merged;
    });
  }, [persistDraft]);

  const clearStepFieldErrors = useCallback((stepKey: keyof OnboardingFieldErrors) => {
    setFieldErrors((prev) => ({ ...prev, [stepKey]: {} }));
  }, []);

  const clearFieldError = useCallback(<K extends keyof OnboardingFieldErrors>(stepKey: K, fieldKey: keyof OnboardingFieldErrors[K]) => {
    setFieldErrors((prev) => {
      const stepErrors = prev[stepKey];
      if (!stepErrors || !(fieldKey in stepErrors)) {
        return prev;
      }
      const nextStepErrors = { ...stepErrors };
      delete nextStepErrors[fieldKey];
      return { ...prev, [stepKey]: nextStepErrors };
    });
  }, []);

  const showErrorToast = useCallback(
    (message: string, title = 'Validation Error') => {
      toast.error(message, title);
    },
    [toast],
  );

  const showSuccessToast = useCallback(
    (message: string, title = 'Success') => {
      toast.success(message, title);
    },
    [toast],
  );

  useEffect(() => {
    passwordSnapshotRef.current = {
      password: formState.profile.password,
      confirmPassword: formState.profile.confirm_password,
    };
  }, [formState.profile.confirm_password, formState.profile.password]);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    if (String(user.status || '').toUpperCase() === 'PENDING' && user.wizard_completed) {
      router.replace('/pending');
      return;
    }

    const bootstrap = async () => {
      try {
        let sessionState: OnboardingState | null = null;
        const sessionRaw = typeof window !== 'undefined' ? window.sessionStorage.getItem(STORAGE_KEY) : null;
        if (sessionRaw) {
          const parsedSessionState = JSON.parse(sessionRaw) as OnboardingState;
          sessionState = parsedSessionState;
          setFormState((prev) => ({
            ...prev,
            ...parsedSessionState,
            profile: {
              ...initialState.profile,
              ...(parsedSessionState.profile || {}),
              profile_image_url: asSafeString(parsedSessionState.profile?.profile_image_url),
              first_name: asSafeString(parsedSessionState.profile?.first_name),
              middle_name: asSafeString(parsedSessionState.profile?.middle_name),
              last_name: asSafeString(parsedSessionState.profile?.last_name),
              email: asSafeString(parsedSessionState.profile?.email),
              username: asSafeString(parsedSessionState.profile?.username),
              phone_number: asSafeString(parsedSessionState.profile?.phone_number),
              password: asSafeString(parsedSessionState.profile?.password),
              confirm_password: asSafeString(parsedSessionState.profile?.confirm_password),
            },
          }));
        }

        const stateResp = await api.get('/merchant/onboarding/state/');
        const payload = stateResp.data;
        const existingDocuments = (payload.documents || []).map((item: any) => ({
          document_type: item.document_type,
          file_url: item.storage_path || item.file_url,
          is_optional: item.is_optional,
        }));
        const selfieDocument = (payload.documents || []).find((item: any) => item.document_type === 'SELFIE_WITH_ID');

        patchState({
          profile: {
            profile_image_url: asSafeString(payload.profile?.profile_image_url),
            first_name: asSafeString(payload.profile?.first_name),
            middle_name: asSafeString(payload.profile?.middle_name),
            last_name: asSafeString(payload.profile?.last_name),
            email: asSafeString(payload.profile?.email),
            username: asSafeString(payload.profile?.username),
            phone_number: asSafeString(payload.profile?.phone_number),
            password: asSafeString(payload.profile?.password) || asSafeString(sessionState?.profile?.password),
            confirm_password: asSafeString(payload.profile?.confirm_password) || asSafeString(sessionState?.profile?.confirm_password),
          },
          business: payload.business
            ? {
                business_name: payload.business.business_name || '',
                registration_type: payload.business.registration_type || 'UNREGISTERED',
                category_ids: (payload.business.categories || []).map((item: any) => item.id),
                business_type_ids: (payload.business.business_types || []).map((item: any) => item.id),
              }
            : initialState.business,
          location: payload.location
            ? {
                house_number: payload.location.house_number || '',
                street_name: payload.location.street_name || '',
                barangay: payload.location.barangay || '',
                city_municipality: payload.location.city_municipality || '',
                province: payload.location.province || '',
                zip_code: payload.location.zip_code || '',
                latitude: payload.location.latitude || '',
                longitude: payload.location.longitude || '',
              }
            : initialState.location,
          documents: {
            selfie_with_id: selfieDocument?.file_url || '',
            items: existingDocuments,
          },
          verification: {
            ...initialState.verification,
            terms_accepted: payload.state?.terms_accepted || false,
            privacy_accepted: payload.state?.privacy_accepted || false,
          },
        });

        setProfileImagePreviewUrl(payload.profile?.profile_image_url || '');

        if (payload.state?.current_step) {
          setCurrentStep(Math.max(0, Math.min(4, Number(payload.state.current_step) - 1)));
        }

        if (payload.state?.is_submitted && !payload.state?.can_resubmit) {
          router.replace('/pending');
        }
      } catch {
        showErrorToast('Failed to load onboarding state.', 'Load Failed');
      }
    };

    void bootstrap();
  }, [patchState, router, showErrorToast, user]);

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [categoryResp, countryResp] = await Promise.all([
          api.get('/merchant/onboarding/categories/'),
          api.get('/merchant/onboarding/country-codes/'),
        ]);

        setCategories(categoryResp.data || []);

        const loadedCountryCodes = (countryResp.data || []) as CountryCodeOption[];
        if (loadedCountryCodes.length) {
          setCountryCodes(loadedCountryCodes);
          const defaultCountry = loadedCountryCodes.find((country) => country.is_default) || loadedCountryCodes[0];
          if (!formState.profile.phone_number && defaultCountry) {
            setPhoneCountryCode(defaultCountry.country_code);
          }
        }
      } catch {
        setCategories([]);
        setCountryCodes([DEFAULT_PHONE_COUNTRY]);
      }
    };

    void loadLookups();
  }, []);

  useEffect(() => {
    if (profileImagePreviewUrl || !formState.profile.profile_image_url) {
      return;
    }
    setProfileImagePreviewUrl(formState.profile.profile_image_url);
  }, [formState.profile.profile_image_url, profileImagePreviewUrl]);

  useEffect(() => {
    const fetchTypes = async () => {
      if (!formState.business.category_ids.length) {
        setBusinessTypes([]);
        return;
      }

      const query = formState.business.category_ids.map((id) => `category_id=${id}`).join('&');
      try {
        const response = await api.get(`/merchant/onboarding/business-types/?${query}`);
        setBusinessTypes(response.data || []);
      } catch {
        setBusinessTypes([]);
      }
    };

    void fetchTypes();
  }, [formState.business.category_ids]);

  useEffect(() => {
    const username = asSafeString(formState.profile.username).trim();
    if (!username) {
      setUsernameAvailability('unknown');
      return;
    }

    const timer = window.setTimeout(async () => {
      setUsernameAvailability('checking');
      try {
        const response = await api.post('/auth/username/check/', { username });
        setUsernameAvailability(response.data?.available ? 'available' : 'taken');
      } catch {
        setUsernameAvailability('unknown');
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [formState.profile.username]);

  const normalizeLocalPhone = useCallback(
    (value: string, countryCode: string) => {
      const maxDigits = getPhoneMaxDigits(countryCode, countryCodes);
      return value.replace(/[^0-9]/g, '').slice(0, maxDigits);
    },
    [countryCodes],
  );

  const updatePhoneValue = useCallback(
    (countryCode: string, localNumber: string) => {
      const normalizedLocal = normalizeLocalPhone(localNumber, countryCode);
      setPhoneCountryCode((prev) => (prev === countryCode ? prev : countryCode));
      setPhoneLocalNumber((prev) => (prev === normalizedLocal ? prev : normalizedLocal));
      const normalizedPhone = normalizedLocal ? `${countryCode}${normalizedLocal}` : '';
      patchNested('profile', { phone_number: normalizedPhone });
      clearFieldError('profile', 'phone_number');
    },
    [clearFieldError, normalizeLocalPhone, patchNested],
  );

  useEffect(() => {
    const parsed = splitPhoneNumber(formState.profile.phone_number, countryCodes);
    const normalizedLocal = normalizeLocalPhone(parsed.localNumber, parsed.countryCode);
    setPhoneCountryCode((prev) => (prev === parsed.countryCode ? prev : parsed.countryCode));
    setPhoneLocalNumber((prev) => (prev === normalizedLocal ? prev : normalizedLocal));

    const normalizedPhone = normalizedLocal ? `${parsed.countryCode}${normalizedLocal}` : '';
    if (formState.profile.phone_number !== normalizedPhone) {
      patchNested('profile', { phone_number: normalizedPhone });
    }
  }, [countryCodes, formState.profile.phone_number, normalizeLocalPhone, patchNested]);

  useEffect(() => {
    const fetchLegal = async () => {
      try {
        const [termsResp, privacyResp] = await Promise.all([
          fetch('/legal/terms-and-conditions.md'),
          fetch('/legal/privacy-policy.md'),
        ]);
        setTermsText(await termsResp.text());
        setPrivacyText(await privacyResp.text());
      } catch {
        setTermsText('Legal review required. Draft unavailable in this environment.');
        setPrivacyText('Legal review required. Draft unavailable in this environment.');
      }
    };

    void fetchLegal();
  }, []);

  const upsertDocument = useCallback((documentType: string, fileUrl: string, isOptional: boolean) => {
    setFormState((prev) => {
      const next = [...prev.documents.items.filter((item) => item.document_type !== documentType)];
      next.push({ document_type: documentType, file_url: fileUrl, is_optional: isOptional });
      const merged = {
        ...prev,
        documents: {
          ...prev.documents,
          items: next,
        },
      };
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      }
      return merged;
    });
  }, []);

  const markDocumentUpload = useCallback((documentType: string, uploading: boolean) => {
    setUploadingDocTypes((prev) => {
      if (uploading) {
        return prev.includes(documentType) ? prev : [...prev, documentType];
      }
      return prev.filter((item) => item !== documentType);
    });
  }, []);

  const uploadDocument = useCallback(
    async (documentType: string, file: File, isOptional: boolean) => {
      markDocumentUpload(documentType, true);
      try {
        const formData = new FormData();
        formData.append('document_type', documentType);
        formData.append('file', file);

        const response = await api.post('/merchant/onboarding/upload-document/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const uploadedUrl = response.data?.file_url;
        const storagePath = response.data?.storage_path || uploadedUrl;
        if (!uploadedUrl || !storagePath) {
          throw new Error('Upload response missing file URL.');
        }

        upsertDocument(documentType, storagePath, isOptional);
        if (documentType === 'SELFIE_WITH_ID') {
          patchNested('documents', { selfie_with_id: uploadedUrl });
        }
      } catch (err: any) {
        showErrorToast(err?.response?.data?.message || 'Unable to upload document.', 'Upload Failed');
      } finally {
        markDocumentUpload(documentType, false);
      }
    },
    [markDocumentUpload, patchNested, showErrorToast, upsertDocument],
  );

  const uploadProfileImage = useCallback(
    async () => {
      if (!profileImageFile) {
        return null;
      }

      setProfileImageUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', profileImageFile);

        const response = await api.post('/merchant/onboarding/upload-profile-image/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const uploadedUrl = response.data?.file_url;
        const storagePath = response.data?.storage_path || uploadedUrl;

        if (!uploadedUrl || !storagePath) {
          throw new Error('Upload response missing image URL.');
        }

        setProfileImagePreviewUrl(uploadedUrl);
        setProfileImageFile(null);
        patchNested('profile', { profile_image_url: storagePath });
        return storagePath;
      } catch (err: any) {
        showErrorToast(err?.response?.data?.message || 'Unable to upload profile image.', 'Upload Failed');
        throw err;
      } finally {
        setProfileImageUploading(false);
      }
    },
    [patchNested, profileImageFile, showErrorToast],
  );

  const validateCurrentStep = (): { message: string | null; errors: OnboardingFieldErrors } => {
    const nextErrors: OnboardingFieldErrors = {
      profile: {},
      business: {},
      location: {},
      documents: {},
      verification: {},
    };

    if (profileImageUploading) {
      return { message: 'Please wait for profile image upload to finish.', errors: nextErrors };
    }

    if (uploadingDocTypes.length > 0) {
      return { message: 'Please wait for document uploads to finish.', errors: nextErrors };
    }

    if (currentStep === 0) {
      const p = formState.profile;

      if (!asSafeString(p.first_name).trim()) {
        nextErrors.profile.first_name = 'First name is required.';
      }
      if (!asSafeString(p.last_name).trim()) {
        nextErrors.profile.last_name = 'Last name is required.';
      }
      if (!asSafeString(p.email).trim()) {
        nextErrors.profile.email = 'Email is required.';
      }
      if (!asSafeString(p.username).trim()) {
        nextErrors.profile.username = 'Username is required.';
      }
      if (!asSafeString(p.phone_number).trim()) {
        nextErrors.profile.phone_number = 'Phone number is required.';
      }
      if (!asSafeString(p.password).trim()) {
        nextErrors.profile.password = 'Password is required.';
      }
      if (!asSafeString(p.confirm_password).trim()) {
        nextErrors.profile.confirm_password = 'Confirm password is required.';
      }
      if (p.password && !isStrongPassword(p.password)) {
        nextErrors.profile.password = 'Use 8+ chars with uppercase, lowercase, number, and special character.';
      }
      if (p.password && p.confirm_password && p.password !== p.confirm_password) {
        nextErrors.profile.confirm_password = 'Passwords do not match.';
      }
      if (usernameAvailability === 'taken') {
        nextErrors.profile.username = 'This username is already in use.';
      }

      if (Object.keys(nextErrors.profile).length > 0) {
        const passwordIssue = Boolean(nextErrors.profile.password || nextErrors.profile.confirm_password);
        return {
          message: passwordIssue ? 'Please correct password requirements before continuing.' : 'Please complete all required profile fields.',
          errors: nextErrors,
        };
      }
    }

    if (currentStep === 1) {
      const b = formState.business;

      if (!asSafeString(b.business_name).trim()) {
        nextErrors.business.business_name = 'Business name is required.';
      }
      if (!b.category_ids.length) {
        nextErrors.business.category_ids = 'Select at least one business category.';
      }
      if (!b.business_type_ids.length) {
        nextErrors.business.business_type_ids = 'Select at least one business type.';
      }

      if (Object.keys(nextErrors.business).length > 0) {
        return { message: 'Please complete all required business fields.', errors: nextErrors };
      }
    }

    if (currentStep === 2) {
      const l = formState.location;
      const hasValue = (value: string) => asSafeString(value).trim().length > 0;
      const latitude = Number(l.latitude);
      const longitude = Number(l.longitude);

      if (
        !hasValue(l.house_number) ||
        !hasValue(l.street_name) ||
        !hasValue(l.barangay) ||
        !hasValue(l.city_municipality) ||
        !hasValue(l.province) ||
        !hasValue(l.zip_code) ||
        !hasValue(l.latitude) ||
        !hasValue(l.longitude)
      ) {
        if (!hasValue(l.house_number)) {
          nextErrors.location.house_number = 'House number is required.';
        }
        if (!hasValue(l.street_name)) {
          nextErrors.location.street_name = 'Street name is required.';
        }
        if (!hasValue(l.barangay)) {
          nextErrors.location.barangay = 'Barangay is required.';
        }
        if (!hasValue(l.city_municipality)) {
          nextErrors.location.city_municipality = 'City / Municipality is required.';
        }
        if (!hasValue(l.province)) {
          nextErrors.location.province = 'Province is required.';
        }
        if (!hasValue(l.zip_code)) {
          nextErrors.location.zip_code = 'Zip code is required.';
        }
        if (!hasValue(l.latitude)) {
          nextErrors.location.latitude = 'Latitude is required.';
        }
        if (!hasValue(l.longitude)) {
          nextErrors.location.longitude = 'Longitude is required.';
        }
        return { message: 'Please complete business location and map coordinates.', errors: nextErrors };
      }

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        nextErrors.location.latitude = 'Latitude must be a valid numeric value.';
        nextErrors.location.longitude = 'Longitude must be a valid numeric value.';
        return { message: 'Please select a valid map location with numeric latitude and longitude.', errors: nextErrors };
      }
    }

    if (currentStep === 3) {
      if (!formState.documents.selfie_with_id) {
        nextErrors.documents.selfie_with_id = 'Selfie with ID is required.';
        return { message: 'Selfie with ID capture is required.', errors: nextErrors };
      }
      const selfieCapturedThisSession = formState.documents.selfie_with_id.startsWith('data:image/');
      if (selfieCapturedThisSession && !selfieFaceValid && typeof window !== 'undefined' && !!window.FaceDetector) {
        return { message: 'Face must be clearly detected before selfie capture.', errors: nextErrors };
      }

      const required = stepDocuments.filter((item) => item.required).map((item) => item.type);
      const submitted = new Set(formState.documents.items.map((item) => item.document_type));
      for (const docType of required) {
        if (!submitted.has(docType)) {
          return { message: `Required document missing: ${docType}`, errors: nextErrors };
        }
      }
    }

    if (currentStep === 4) {
      const v = formState.verification;

      if (!asSafeString(v.email_otp).trim()) {
        nextErrors.verification.email_otp = 'Email OTP is required.';
      }
      if (!asSafeString(v.phone_otp).trim()) {
        nextErrors.verification.phone_otp = 'Phone OTP is required.';
      }
      if (!v.terms_accepted) {
        nextErrors.verification.terms_accepted = 'You must accept Terms and Conditions.';
      }
      if (!v.privacy_accepted) {
        nextErrors.verification.privacy_accepted = 'You must accept the Privacy Policy.';
      }

      if (Object.keys(nextErrors.verification).length > 0) {
        return { message: 'Please complete OTP and policy acceptance requirements.', errors: nextErrors };
      }
    }

    return { message: null, errors: nextErrors };
  };

  const saveCurrentStep = async () => {
    if (currentStep === 0) {
      const profilePayload = { ...formState.profile };
      const uploadedPath = await uploadProfileImage();
      if (uploadedPath) {
        profilePayload.profile_image_url = uploadedPath;
      }
      await api.post('/merchant/onboarding/step/profile/', profilePayload);
    }
    if (currentStep === 1) {
      await api.post('/merchant/onboarding/step/business/', formState.business);
    }
    if (currentStep === 2) {
      const normalizedLatitude = normalizeCoordinate(formState.location.latitude);
      const normalizedLongitude = normalizeCoordinate(formState.location.longitude);

      if (!normalizedLatitude || !normalizedLongitude) {
        throw new Error('Location coordinates must be valid numeric values.');
      }

      await api.post('/merchant/onboarding/step/location/', {
        ...formState.location,
        latitude: normalizedLatitude,
        longitude: normalizedLongitude,
      });

      if (formState.location.latitude !== normalizedLatitude || formState.location.longitude !== normalizedLongitude) {
        patchNested('location', {
          latitude: normalizedLatitude,
          longitude: normalizedLongitude,
        });
      }
    }
    if (currentStep === 3) {
      await api.post('/merchant/onboarding/step/documents/', {
        documents: formState.documents.items,
      });
    }
  };

  const onNext = async () => {
    const validationResult = validateCurrentStep();
    setFieldErrors(validationResult.errors);
    if (validationResult.message) {
      showErrorToast(validationResult.message);
      return;
    }

    setSaving(true);
    try {
      await saveCurrentStep();
      clearStepFieldErrors(
        currentStep === 0
          ? 'profile'
          : currentStep === 1
          ? 'business'
          : currentStep === 2
          ? 'location'
          : currentStep === 3
          ? 'documents'
          : 'verification',
      );
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || 'Unable to save this step.', 'Save Failed');
    } finally {
      setSaving(false);
    }
  };

  const onPrevious = () => {
    const targetStep = Math.max(currentStep - 1, 0);

    if (targetStep === 0) {
      const snapshot = passwordSnapshotRef.current;
      if (snapshot.password || snapshot.confirmPassword) {
        patchNested('profile', {
          password: snapshot.password,
          confirm_password: snapshot.confirmPassword,
        });
      }
    }

    clearStepFieldErrors(
      currentStep === 0
        ? 'profile'
        : currentStep === 1
        ? 'business'
        : currentStep === 2
        ? 'location'
        : currentStep === 3
        ? 'documents'
        : 'verification',
    );
      setCurrentStep(targetStep);
  };

  const onSubmit = async () => {
    const validationResult = validateCurrentStep();
    setFieldErrors(validationResult.errors);
    if (validationResult.message) {
      showErrorToast(validationResult.message);
      return;
    }
    setShowSubmitConfirm(true);
  };

  const confirmSubmit = async () => {
    setSaving(true);
    try {
      await api.post('/merchant/onboarding/submit/', {
        email_otp: formState.verification.email_otp,
        phone_otp: formState.verification.phone_otp,
        terms_accepted: formState.verification.terms_accepted,
        privacy_accepted: formState.verification.privacy_accepted,
      });

      const updatedUser = {
        ...user,
        status: 'PENDING',
        wizard_completed: true,
      };
      if (updatedUser && setUser) {
        setUser(updatedUser as any);
      }

      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
      showSuccessToast('Your onboarding application has been submitted and is now pending review.', 'Submitted');
      router.push('/pending');
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || 'Submission failed. Please retry.', 'Submission Failed');
    } finally {
      setSaving(false);
      setShowSubmitConfirm(false);
    }
  };

  const requestVerificationOtp = async () => {
    if (uploadingDocTypes.length > 0) {
      showErrorToast('Please wait for document uploads to finish before requesting OTP.');
      return;
    }

    try {
      await saveCurrentStep();
      await api.post('/merchant/onboarding/send-otp/');
      showSuccessToast('Verification OTP sent to your email and phone.', 'OTP Sent');
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || 'Unable to send OTP.', 'OTP Failed');
    }
  };

  const renderProfileStep = () => {
    const initials = profileInitials(formState.profile.first_name, formState.profile.last_name);
    const usernameError = usernameAvailability === 'taken' ? 'This username is already in use.' : fieldErrors.profile.username;

    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-slate-800">Profile image (optional)</p>
          <p className="mb-3 text-xs text-slate-500">If no image is uploaded, your account will use initials until you add one later.</p>

          <ProfileImageUpload
            label=""
            file={profileImageFile}
            initials={initials}
            remoteImageUrl={profileImagePreviewUrl || formState.profile.profile_image_url}
            onFileChange={(file) => {
              if (!file) {
                setProfileImageFile(null);
                return;
              }

              const maxSize = 5 * 1024 * 1024;
              if (file.size > maxSize) {
                showErrorToast('Profile image exceeds 5MB size limit.', 'Upload Failed');
                return;
              }

              setProfileImageFile(file);
            }}
          />

          {profileImageUploading ? (
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary-700">
              <Loader2 size={12} className="animate-spin" />
              Uploading profile image...
            </p>
          ) : null}
          <p className="mt-2 text-xs text-slate-500">Drop images here or click to browse. PNG, JPEG, and WEBP are supported.</p>
        </div>

        <Input
          label="First name *"
          placeholder="Enter your first name"
          value={formState.profile.first_name}
          onChange={(e) => {
            patchNested('profile', { first_name: e.target.value });
            clearFieldError('profile', 'first_name');
          }}
          error={fieldErrors.profile.first_name}
        />

        <Input
          label="Middle name"
          placeholder="Enter your middle name (optional)"
          value={formState.profile.middle_name}
          onChange={(e) => patchNested('profile', { middle_name: e.target.value })}
        />

        <Input
          label="Last name *"
          placeholder="Enter your last name"
          value={formState.profile.last_name}
          onChange={(e) => {
            patchNested('profile', { last_name: e.target.value });
            clearFieldError('profile', 'last_name');
          }}
          error={fieldErrors.profile.last_name}
        />

        <Input
          label="Email *"
          placeholder="Enter your email address"
          value={formState.profile.email}
          readOnly={isGoogleLinked}
          onChange={(e) => {
            patchNested('profile', { email: e.target.value });
            clearFieldError('profile', 'email');
          }}
          hint={isGoogleLinked ? 'Read-only for Google-linked account.' : undefined}
          error={fieldErrors.profile.email}
          className={isGoogleLinked ? 'bg-slate-100' : ''}
        />

        <Input
          label="Username *"
          placeholder="Choose a unique username"
          value={asSafeString(formState.profile.username)}
          onChange={(e) => {
            patchNested('profile', { username: e.target.value });
            clearFieldError('profile', 'username');
          }}
          hint={
            usernameAvailability === 'checking'
              ? 'Checking username...'
              : usernameAvailability === 'available'
              ? 'Username is available'
              : usernameAvailability === 'taken'
              ? 'Username is already taken'
              : 'Enter a username to check availability'
          }
          error={usernameError}
        />

        <PhoneNumberInput
          label="Phone number *"
          countryCode={phoneCountryCode}
          phone={phoneLocalNumber}
          countries={countryCodeOptions}
          onCountryCodeChange={(value) => updatePhoneValue(value, phoneLocalNumber)}
          onPhoneChange={(value) => updatePhoneValue(phoneCountryCode, value)}
          placeholder="Enter your mobile number"
          error={fieldErrors.profile.phone_number}
        />

        <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
          <PasswordInput
            value={formState.profile.password}
            onChange={(value) => {
              patchNested('profile', { password: value });
              clearFieldError('profile', 'password');
            }}
            hint={passwordStrong ? 'Password meets all complexity requirements.' : undefined}
            error={fieldErrors.profile.password}
          />
          <ConfirmPasswordInput
            password={formState.profile.password}
            confirmPassword={formState.profile.confirm_password}
            onChange={(value) => {
              patchNested('profile', { confirm_password: value });
              clearFieldError('profile', 'confirm_password');
            }}
            error={fieldErrors.profile.confirm_password}
          />
        </div>
      </div>
    );
  };

  const renderBusinessStep = () => {
    return (
      <div className="grid gap-4">
        <Input
          label="Business name *"
          placeholder="Enter your registered or trade business name"
          value={formState.business.business_name}
          onChange={(e) => {
            patchNested('business', { business_name: e.target.value });
            clearFieldError('business', 'business_name');
          }}
          error={fieldErrors.business.business_name}
        />

        <MultiSelectDropdown
          label="Business category *"
          value={formState.business.category_ids}
          options={categoryOptions}
          onChange={(value) => {
            patchNested('business', { category_ids: value, business_type_ids: [] });
            clearFieldError('business', 'category_ids');
            clearFieldError('business', 'business_type_ids');
          }}
          placeholder="Select one or more categories"
          error={fieldErrors.business.category_ids}
        />

        <MultiSelectDropdown
          label="Business type *"
          value={formState.business.business_type_ids}
          options={businessTypeOptions}
          onChange={(value) => {
            patchNested('business', { business_type_ids: value });
            clearFieldError('business', 'business_type_ids');
          }}
          placeholder={
            formState.business.category_ids.length
              ? 'Select one or more business types'
              : 'Select categories first'
          }
          disabled={!formState.business.category_ids.length}
          error={fieldErrors.business.business_type_ids}
        />

        <Dropdown
          label="Business registration *"
          value={formState.business.registration_type}
          options={[
            { value: 'UNREGISTERED', label: 'Unregistered' },
            { value: 'REGISTERED_NON_VAT', label: 'Registered (Non-VAT)' },
            { value: 'REGISTERED_VAT', label: 'Registered (VAT Included)' },
          ]}
          onChange={(value) => {
            patchNested('business', { registration_type: value as RegistrationType });
            clearFieldError('business', 'registration_type');
          }}
          error={fieldErrors.business.registration_type}
        />
      </div>
    );
  };

  const renderLocationStep = () => (
    <div className="grid gap-4 md:grid-cols-2">
      <Input
        label="House number *"
        placeholder="House number, block, or lot"
        value={formState.location.house_number}
        onChange={(e) => {
          patchNested('location', { house_number: e.target.value });
          clearFieldError('location', 'house_number');
        }}
        error={fieldErrors.location.house_number}
      />
      <Input
        label="Street name *"
        placeholder="Street, subdivision, or zone"
        value={formState.location.street_name}
        onChange={(e) => {
          patchNested('location', { street_name: e.target.value });
          clearFieldError('location', 'street_name');
        }}
        error={fieldErrors.location.street_name}
      />
      <Input
        label="Barangay *"
        placeholder="Enter barangay"
        value={formState.location.barangay}
        onChange={(e) => {
          patchNested('location', { barangay: e.target.value });
          clearFieldError('location', 'barangay');
        }}
        error={fieldErrors.location.barangay}
      />
      <Input
        label="City / Municipality *"
        placeholder="Enter city or municipality"
        value={formState.location.city_municipality}
        onChange={(e) => {
          patchNested('location', { city_municipality: e.target.value });
          clearFieldError('location', 'city_municipality');
        }}
        error={fieldErrors.location.city_municipality}
      />
      <Input
        label="Province *"
        placeholder="Enter province"
        value={formState.location.province}
        onChange={(e) => {
          patchNested('location', { province: e.target.value });
          clearFieldError('location', 'province');
        }}
        error={fieldErrors.location.province}
      />
      <Input
        label="Zip code *"
        placeholder="e.g., 4103"
        value={formState.location.zip_code}
        onChange={(e) => {
          patchNested('location', { zip_code: e.target.value });
          clearFieldError('location', 'zip_code');
        }}
        error={fieldErrors.location.zip_code}
      />

      <Input label="Latitude *" value={formState.location.latitude} readOnly className="bg-slate-100" error={fieldErrors.location.latitude} />
      <Input label="Longitude *" value={formState.location.longitude} readOnly className="bg-slate-100" error={fieldErrors.location.longitude} />

      <div className="md:col-span-2">
        <Button type="button" variant="secondary" onClick={() => setShowMap(true)}>
          Choose Location on Map
        </Button>
      </div>
    </div>
  );

  const renderDocumentsStep = () => (
    <div className="space-y-4">
      <div className={fieldErrors.documents.selfie_with_id ? 'rounded-xl border border-red-300 bg-red-50/40 p-4 shadow-sm' : 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm'}>
        <h4 className="mb-2 font-semibold text-slate-900">Selfie with ID *</h4>
        <SelfieCapture
          value={formState.documents.selfie_with_id}
          onCapture={(dataUrl, detected) => {
            setSelfieFaceValid(detected);
            patchNested('documents', { selfie_with_id: dataUrl });
            clearFieldError('documents', 'selfie_with_id');
            void (async () => {
              try {
                const selfieFile = await dataUrlToFile(dataUrl, 'selfie-with-id.jpg');
                await uploadDocument('SELFIE_WITH_ID', selfieFile, false);
              } catch {
                showErrorToast('Failed to process selfie capture for upload.', 'Upload Failed');
              }
            })();
          }}
        />
        {fieldErrors.documents.selfie_with_id ? <p className="mt-2 text-xs font-medium text-red-600">{fieldErrors.documents.selfie_with_id}</p> : null}
        {uploadingDocTypes.includes('SELFIE_WITH_ID') ? (
          <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary-700">
            <Loader2 size={12} className="animate-spin" />
            Uploading selfie with ID...
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        {stepDocuments
          .filter((item) => item.type !== 'SELFIE_WITH_ID')
          .map((item) => {
            const existing = formState.documents.items.find((entry) => entry.document_type === item.type);
            return (
              <div key={item.type} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <FileUpload
                  label={`${item.label} ${item.required ? '*' : '(Optional)'}`}
                  files={documentPickerFiles[item.type] || []}
                  multiple={false}
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onFilesChange={(files) => {
                    const selected = files.slice(0, 1);
                    setDocumentPickerFiles((prev) => ({ ...prev, [item.type]: selected }));

                    const file = selected[0];
                    if (!file) {
                      return;
                    }

                    const maxSize = 5 * 1024 * 1024;
                    if (file.size > maxSize) {
                      showErrorToast(`${item.label} exceeds 5MB size limit.`, 'Upload Failed');
                      return;
                    }
                    void uploadDocument(item.type, file, !item.required);
                  }}
                />

                <p className="mt-2 text-xs text-slate-500">
                  {existing ? `Uploaded: ${existing.file_url}` : 'No file uploaded yet.'}
                </p>
                {uploadingDocTypes.includes(item.type) ? (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary-700">
                    <Loader2 size={12} className="animate-spin" />
                    Uploading...
                  </p>
                ) : null}
              </div>
            );
          })}
      </div>
    </div>
  );

  const renderVerificationStep = () => (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-primary-50/40 p-4">
        <h4 className="inline-flex items-center gap-2 font-semibold text-slate-900">
          <ShieldCheck size={16} className="text-primary-600" />
          Final Review
        </h4>
        <p className="mt-2 text-sm text-slate-600">
          Review your profile, business, location, and document entries before final submission.
        </p>
      </div>

      <Button type="button" variant="secondary" onClick={requestVerificationOtp}>
        Send / Resend OTP
      </Button>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Email OTP *"
          placeholder="Enter the 6-digit email OTP"
          value={formState.verification.email_otp}
          onChange={(e) => {
            patchNested('verification', { email_otp: e.target.value });
            clearFieldError('verification', 'email_otp');
          }}
          error={fieldErrors.verification.email_otp}
        />
        <Input
          label="Phone OTP *"
          placeholder="Enter the 6-digit SMS OTP"
          value={formState.verification.phone_otp}
          onChange={(e) => {
            patchNested('verification', { phone_otp: e.target.value });
            clearFieldError('verification', 'phone_otp');
          }}
          error={fieldErrors.verification.phone_otp}
        />
      </div>

      <div className="space-y-3">
        <Checkbox
          checked={formState.verification.terms_accepted}
          onChange={(e) => {
            patchNested('verification', { terms_accepted: e.target.checked });
            clearFieldError('verification', 'terms_accepted');
          }}
          label="I agree to the Terms and Conditions"
          description="Acceptance is required before merchant onboarding submission."
          error={fieldErrors.verification.terms_accepted}
        />
        <button type="button" className="text-sm font-medium text-primary-700 underline" onClick={() => setShowTermsModal(true)}>
          View Terms and Conditions
        </button>

        <Checkbox
          checked={formState.verification.privacy_accepted}
          onChange={(e) => {
            patchNested('verification', { privacy_accepted: e.target.checked });
            clearFieldError('verification', 'privacy_accepted');
          }}
          label="I agree to the Privacy Policy"
          description="You acknowledge data handling requirements for onboarding."
          error={fieldErrors.verification.privacy_accepted}
        />
        <button type="button" className="text-sm font-medium text-primary-700 underline" onClick={() => setShowPrivacyModal(true)}>
          View Privacy Policy
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fbff_0%,_#f3f6fb_50%,_#eef2f8_100%)] p-4 md:p-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Merchant Setup Wizard</h1>
            <p className="mt-1 text-sm text-slate-600">Complete all 5 steps. Final data submission happens only at Step 5.</p>
          </div>
          <Button type="button" variant="secondary" onClick={handleLogout} className="self-start">
            <LogOut size={16} />
            Logout
          </Button>
        </div>

        <Wizard
          steps={steps}
          currentStep={currentStep}
          onStepChange={(index) => {
            if (index <= currentStep) {
              setCurrentStep(index);
            }
          }}
          onNext={onNext}
          onPrevious={onPrevious}
          onSubmit={onSubmit}
          submitting={saving || uploadingDocTypes.length > 0 || profileImageUploading}
        >
          {currentStep === 0 ? renderProfileStep() : null}
          {currentStep === 1 ? renderBusinessStep() : null}
          {currentStep === 2 ? renderLocationStep() : null}
          {currentStep === 3 ? renderDocumentsStep() : null}
          {currentStep === 4 ? renderVerificationStep() : null}
        </Wizard>
      </div>

      <MapPickerModal
        open={showMap}
        onClose={() => setShowMap(false)}
        latitude={formState.location.latitude}
        longitude={formState.location.longitude}
        provider={MAP_PROVIDER === 'leaflet' ? 'leaflet' : 'manual'}
        onSave={(lat, lng) =>
          patchNested('location', {
            latitude: normalizeCoordinate(lat),
            longitude: normalizeCoordinate(lng),
          })
        }
      />

      {showTermsModal ? (
        <Modal title="Terms and Conditions (Draft - Legal Review Required)" onClose={() => setShowTermsModal(false)}>
          {termsText}
        </Modal>
      ) : null}

      {showPrivacyModal ? (
        <Modal title="Privacy Policy (Draft - Legal Review Required)" onClose={() => setShowPrivacyModal(false)}>
          {privacyText}
        </Modal>
      ) : null}

      {showSubmitConfirm ? (
        <Modal title="Confirm Submission" onClose={() => setShowSubmitConfirm(false)}>
          <p>Are you sure you want to submit your application? You will not be able to edit your information after submission.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowSubmitConfirm(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmSubmit}>
              <CheckCircle2 size={16} />
              Confirm Submit
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
