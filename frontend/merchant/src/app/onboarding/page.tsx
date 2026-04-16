'use client';

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Wizard } from '@shared/components/ui';

interface BusinessCategory {
  id: string;
  name: string;
}

interface BusinessType {
  id: string;
  name: string;
  category_id: string;
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

declare global {
  interface Window {
    L?: any;
    FaceDetector?: any;
  }
}

const STORAGE_KEY = 'merchant_onboarding_draft';
const MAP_PROVIDER = process.env.NEXT_PUBLIC_MAP_PROVIDER || 'leaflet';

const PHONE_COUNTRY_OPTIONS = [
  { code: '+63', label: 'PH (+63)' },
  { code: '+1', label: 'US (+1)' },
  { code: '+65', label: 'SG (+65)' },
];

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

const steps = [
  { id: 'profile', title: 'Profile' },
  { id: 'business', title: 'Business' },
  { id: 'location', title: 'Location' },
  { id: 'documents', title: 'Documents' },
  { id: 'verify', title: 'Verify & Submit' },
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

async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-lg border border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button className="text-sm text-gray-500 hover:text-gray-700" onClick={onClose}>Close</button>
        </div>
        <div className="max-h-[70vh] overflow-auto p-4 text-sm text-gray-700 whitespace-pre-wrap">{children}</div>
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
      <div className="relative w-full overflow-hidden rounded-lg border border-gray-300 bg-black">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-[280px] object-cover" />
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
      <p className="text-xs text-gray-500">
        {supportsFaceDetector
          ? faceDetected
            ? 'Face detected. Capture is enabled.'
            : 'No face detected yet. Center your face and ID in frame.'
          : 'Face detection not supported in this browser. Capture-only fallback is active.'}
      </p>
      <button
        type="button"
        onClick={capture}
        className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600"
      >
        Capture Selfie with ID
      </button>
      {value ? <img src={value} alt="Selfie with ID" className="h-40 rounded-lg border border-gray-300 object-cover" /> : null}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

function LeafletMapModal({
  open,
  onClose,
  latitude,
  longitude,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  latitude: string;
  longitude: string;
  onSave: (lat: string, lng: string) => void;
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [selectedLat, setSelectedLat] = useState(latitude);
  const [selectedLng, setSelectedLng] = useState(longitude);

  useEffect(() => {
    setSelectedLat(latitude);
    setSelectedLng(longitude);
  }, [latitude, longitude]);

  useEffect(() => {
    if (!open || MAP_PROVIDER !== 'leaflet') {
      return;
    }

    const setupMap = () => {
      if (!window.L || !mapRef.current || instanceRef.current) {
        return;
      }

      const lat = Number(selectedLat || '14.5995');
      const lng = Number(selectedLng || '120.9842');
      const map = window.L.map(mapRef.current).setView([lat, lng], 13);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      markerRef.current = window.L.marker([lat, lng]).addTo(map);
      map.on('click', (event: any) => {
        const { lat: newLat, lng: newLng } = event.latlng;
        markerRef.current.setLatLng([newLat, newLng]);
        setSelectedLat(String(newLat));
        setSelectedLng(String(newLng));
      });

      instanceRef.current = map;
    };

    if (!window.L) {
      const cssId = 'leaflet-css';
      const jsId = 'leaflet-js';

      if (!document.getElementById(cssId)) {
        const css = document.createElement('link');
        css.id = cssId;
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);
      }

      if (!document.getElementById(jsId)) {
        const script = document.createElement('script');
        script.id = jsId;
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = setupMap;
        document.body.appendChild(script);
      } else {
        setupMap();
      }
    } else {
      setupMap();
    }

    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [open, selectedLat, selectedLng]);

  const useCurrentLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setSelectedLat(String(lat));
        setSelectedLng(String(lng));
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
        if (instanceRef.current) {
          instanceRef.current.setView([lat, lng], 15);
        }
      },
      () => undefined,
    );
  };

  if (!open) {
    return null;
  }

  return (
    <Modal title="Choose Business Location" onClose={onClose}>
      {MAP_PROVIDER === 'leaflet' ? (
        <div className="space-y-3">
          <div ref={mapRef} className="h-[360px] w-full rounded-lg border border-gray-300" />
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" onClick={useCurrentLocation}>
              Use Current Location
            </button>
            <div className="text-xs text-gray-600">Lat: {selectedLat || '-'} | Lng: {selectedLng || '-'}</div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Map provider fallback mode is active. Enter coordinates manually.</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={selectedLat}
              onChange={(e) => setSelectedLat(e.target.value)}
              placeholder="Latitude"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              value={selectedLng}
              onChange={(e) => setSelectedLng(e.target.value)}
              placeholder="Longitude"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="rounded-lg bg-primary-500 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-600"
          onClick={() => {
            onSave(selectedLat, selectedLng);
            onClose();
          }}
        >
          Save Coordinates
        </button>
      </div>
    </Modal>
  );
}

export default function MerchantOnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [currentStep, setCurrentStep] = useState(0);
  const [formState, setFormState] = useState<OnboardingState>(initialState);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [usernameAvailability, setUsernameAvailability] = useState<'unknown' | 'checking' | 'available' | 'taken'>('unknown');
  const [showMap, setShowMap] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [selfieFaceValid, setSelfieFaceValid] = useState(false);
  const [uploadingDocTypes, setUploadingDocTypes] = useState<string[]>([]);
  const [profileImageUploading, setProfileImageUploading] = useState(false);
  const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+63');
  const [phoneLocalNumber, setPhoneLocalNumber] = useState('');
  const [termsText, setTermsText] = useState('Loading terms...');
  const [privacyText, setPrivacyText] = useState('Loading privacy...');

  const stepDocuments = useMemo(() => documentMatrix[formState.business.registration_type], [formState.business.registration_type]);
  const isGoogleLinked = useMemo(() => Boolean(user?.google_id), [user]);
  const passwordStrong = useMemo(() => isStrongPassword(formState.profile.password), [formState.profile.password]);

  const patchState = useCallback((patch: Partial<OnboardingState>) => {
    setFormState((prev) => {
      const merged = { ...prev, ...patch };
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      }
      return merged;
    });
  }, []);

  const patchNested = useCallback(<K extends keyof OnboardingState>(key: K, patch: Partial<OnboardingState[K]>) => {
    setFormState((prev) => {
      const merged = {
        ...prev,
        [key]: { ...prev[key], ...patch },
      };
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      }
      return merged;
    });
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
        const sessionRaw = typeof window !== 'undefined' ? window.sessionStorage.getItem(STORAGE_KEY) : null;
        if (sessionRaw) {
          const sessionState = JSON.parse(sessionRaw) as OnboardingState;
          setFormState((prev) => ({
            ...prev,
            ...sessionState,
            profile: {
              ...initialState.profile,
              ...sessionState.profile,
              profile_image_url: asSafeString(sessionState?.profile?.profile_image_url),
              first_name: asSafeString(sessionState?.profile?.first_name),
              middle_name: asSafeString(sessionState?.profile?.middle_name),
              last_name: asSafeString(sessionState?.profile?.last_name),
              email: asSafeString(sessionState?.profile?.email),
              username: asSafeString(sessionState?.profile?.username),
              phone_number: asSafeString(sessionState?.profile?.phone_number),
              password: asSafeString(sessionState?.profile?.password),
              confirm_password: asSafeString(sessionState?.profile?.confirm_password),
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
            password: '',
            confirm_password: '',
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

        const profileImageFromState = payload.profile?.profile_image_url || '';
        setProfileImagePreviewUrl(profileImageFromState);

        const loadedPhone = String(payload.profile?.phone_number || '');
        const matchedCountry = PHONE_COUNTRY_OPTIONS.find((option) => loadedPhone.startsWith(option.code));
        if (matchedCountry) {
          setPhoneCountryCode(matchedCountry.code);
          setPhoneLocalNumber(loadedPhone.slice(matchedCountry.code.length).replace(/\D/g, ''));
        } else {
          setPhoneCountryCode('+63');
          setPhoneLocalNumber(loadedPhone.replace(/\D/g, ''));
        }

        if (payload.state?.current_step) {
          setCurrentStep(Math.max(0, Math.min(4, Number(payload.state.current_step) - 1)));
        }

        if (payload.state?.is_submitted && !payload.state?.can_resubmit) {
          router.replace('/pending');
        }
      } catch {
        setError('Failed to load onboarding state.');
      }
    };

    void bootstrap();
  }, [patchState, router, user]);

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const categoryResp = await api.get('/merchant/onboarding/categories/');
        setCategories(categoryResp.data || []);
      } catch {
        setCategories([]);
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

  useEffect(() => {
    const normalizedPhone = `${phoneCountryCode}${phoneLocalNumber}`;
    if (formState.profile.phone_number === normalizedPhone) {
      return;
    }
    patchNested('profile', { phone_number: normalizedPhone });
  }, [formState.profile.phone_number, patchNested, phoneCountryCode, phoneLocalNumber]);

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
      setError('');
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
        setError(err?.response?.data?.message || 'Unable to upload document.');
      } finally {
        markDocumentUpload(documentType, false);
      }
    },
    [markDocumentUpload, patchNested, upsertDocument],
  );

  const uploadProfileImage = useCallback(
    async (file: File) => {
      setProfileImageUploading(true);
      setError('');
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/merchant/onboarding/upload-profile-image/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const uploadedUrl = response.data?.file_url;
        const storagePath = response.data?.storage_path || uploadedUrl;

        if (!uploadedUrl || !storagePath) {
          throw new Error('Upload response missing image URL.');
        }

        patchNested('profile', { profile_image_url: storagePath });
        setProfileImagePreviewUrl(uploadedUrl);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to upload profile image.');
      } finally {
        setProfileImageUploading(false);
      }
    },
    [patchNested],
  );

  const validateCurrentStep = (): string | null => {
    if (profileImageUploading) {
      return 'Please wait for profile image upload to finish.';
    }

    if (uploadingDocTypes.length > 0) {
      return 'Please wait for document uploads to finish.';
    }

    if (currentStep === 0) {
      const p = formState.profile;
      if (!p.profile_image_url || !p.first_name || !p.last_name || !p.email || !p.username || !p.phone_number) {
        return 'Please complete all required profile fields.';
      }
      if (!p.password || !p.confirm_password) {
        return 'Password and confirm password are required.';
      }
      if (!isStrongPassword(p.password)) {
        return 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.';
      }
      if (p.password !== p.confirm_password) {
        return 'Password and confirm password do not match.';
      }
      if (usernameAvailability === 'taken') {
        return 'Username is already taken.';
      }
    }

    if (currentStep === 1) {
      const b = formState.business;
      if (!b.business_name || !b.category_ids.length || !b.business_type_ids.length) {
        return 'Please complete all required business fields.';
      }
    }

    if (currentStep === 2) {
      const l = formState.location;
      if (
        !l.house_number ||
        !l.street_name ||
        !l.barangay ||
        !l.city_municipality ||
        !l.province ||
        !l.zip_code ||
        !l.latitude ||
        !l.longitude
      ) {
        return 'Please complete business location and map coordinates.';
      }
    }

    if (currentStep === 3) {
      if (!formState.documents.selfie_with_id) {
        return 'Selfie with ID capture is required.';
      }
      const selfieCapturedThisSession = formState.documents.selfie_with_id.startsWith('data:image/');
      if (selfieCapturedThisSession && !selfieFaceValid && typeof window !== 'undefined' && !!window.FaceDetector) {
        return 'Face must be clearly detected before selfie capture.';
      }

      const required = stepDocuments.filter((item) => item.required).map((item) => item.type);
      const submitted = new Set(formState.documents.items.map((item) => item.document_type));
      for (const docType of required) {
        if (!submitted.has(docType)) {
          return `Required document missing: ${docType}`;
        }
      }
    }

    if (currentStep === 4) {
      const v = formState.verification;
      if (!v.email_otp || !v.phone_otp) {
        return 'Email OTP and phone OTP are required.';
      }
      if (!v.terms_accepted || !v.privacy_accepted) {
        return 'You must accept Terms and Privacy Policy to submit.';
      }
    }

    return null;
  };

  const saveCurrentStep = async () => {
    if (currentStep === 0) {
      await api.post('/merchant/onboarding/step/profile/', formState.profile);
    }
    if (currentStep === 1) {
      await api.post('/merchant/onboarding/step/business/', formState.business);
    }
    if (currentStep === 2) {
      await api.post('/merchant/onboarding/step/location/', {
        ...formState.location,
        latitude: Number(formState.location.latitude),
        longitude: Number(formState.location.longitude),
      });
    }
    if (currentStep === 3) {
      await api.post('/merchant/onboarding/step/documents/', {
        documents: formState.documents.items,
      });
    }
  };

  const onNext = async () => {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');
    try {
      await saveCurrentStep();
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to save this step.');
    } finally {
      setSaving(false);
    }
  };

  const onPrevious = () => {
    setError('');
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const onSubmit = async () => {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setShowSubmitConfirm(true);
  };

  const confirmSubmit = async () => {
    setSaving(true);
    setError('');
    setInfo('');
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
      router.push('/pending');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Submission failed. Please retry.');
    } finally {
      setSaving(false);
      setShowSubmitConfirm(false);
    }
  };

  const requestVerificationOtp = async () => {
    if (uploadingDocTypes.length > 0) {
      setError('Please wait for document uploads to finish before requesting OTP.');
      return;
    }

    try {
      await saveCurrentStep();
      await api.post('/merchant/onboarding/send-otp/');
      setInfo('Verification OTP sent to your email and phone.');
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to send OTP.');
    }
  };

  const renderProfileStep = () => (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="text-sm text-gray-700 md:col-span-2 rounded-lg border border-gray-300 bg-white p-3">
        <p className="font-medium text-gray-900">Profile image *</p>
        <p className="mt-1 text-xs text-gray-500">A clear profile image is required before you can continue.</p>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) {
              return;
            }
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
              setError('Profile image exceeds 5MB size limit.');
              return;
            }
            void uploadProfileImage(file);
          }}
          className="mt-2 block w-full text-sm text-gray-600"
        />
        {profileImageUploading ? <p className="mt-2 text-xs text-blue-600">Uploading profile image...</p> : null}
        {profileImagePreviewUrl || formState.profile.profile_image_url ? (
          <img
            src={profileImagePreviewUrl || formState.profile.profile_image_url}
            alt="Profile preview"
            className="mt-3 h-32 w-32 rounded-lg border border-gray-300 object-cover"
          />
        ) : null}
      </div>

      <label className="text-sm text-gray-700">
        First name *
        <input
          value={formState.profile.first_name}
          onChange={(e) => patchNested('profile', { first_name: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="text-sm text-gray-700">
        Middle name
        <input
          value={formState.profile.middle_name}
          onChange={(e) => patchNested('profile', { middle_name: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="text-sm text-gray-700">
        Last name *
        <input
          value={formState.profile.last_name}
          onChange={(e) => patchNested('profile', { last_name: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="text-sm text-gray-700">
        Email * {isGoogleLinked ? '(read-only for Google-linked account)' : ''}
        <input
          value={formState.profile.email}
          readOnly={isGoogleLinked}
          onChange={(e) => patchNested('profile', { email: e.target.value })}
          className={`mt-1 w-full rounded-lg px-3 py-2 text-sm ${
            isGoogleLinked ? 'border border-gray-200 bg-gray-100' : 'border border-gray-300'
          }`}
        />
      </label>

      <label className="text-sm text-gray-700">
        Username *
        <input
          value={asSafeString(formState.profile.username)}
          onChange={(e) => patchNested('profile', { username: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <span className="mt-1 block text-xs text-gray-500">
          {usernameAvailability === 'checking'
            ? 'Checking username...'
            : usernameAvailability === 'available'
            ? 'Username is available'
            : usernameAvailability === 'taken'
            ? 'Username is already taken'
            : 'Enter a username to check availability'}
        </span>
      </label>

      <label className="text-sm text-gray-700">
        Phone number *
        <div className="mt-1 flex gap-2">
          <select
            value={phoneCountryCode}
            onChange={(e) => setPhoneCountryCode(e.target.value)}
            className="w-32 rounded-lg border border-gray-300 px-2 py-2 text-sm"
          >
            {PHONE_COUNTRY_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            value={phoneLocalNumber}
            onChange={(e) => setPhoneLocalNumber(e.target.value.replace(/\D/g, '').slice(0, 15))}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="9123456789"
          />
        </div>
      </label>

      <label className="text-sm text-gray-700">
        Password *
        <input
          type="password"
          value={formState.profile.password}
          onChange={(e) => patchNested('profile', { password: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="At least 8 chars, upper/lower/number/special"
        />
        <span className={`mt-1 block text-xs ${passwordStrong ? 'text-emerald-600' : 'text-gray-500'}`}>
          {passwordStrong
            ? 'Password meets complexity requirements.'
            : 'Password must include uppercase, lowercase, number, and special character.'}
        </span>
      </label>

      <label className="text-sm text-gray-700">
        Confirm password *
        <input
          type="password"
          value={formState.profile.confirm_password}
          onChange={(e) => patchNested('profile', { confirm_password: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <span className={`mt-1 block text-xs ${
          formState.profile.confirm_password && formState.profile.confirm_password !== formState.profile.password
            ? 'text-red-600'
            : 'text-gray-500'
        }`}>
          {formState.profile.confirm_password && formState.profile.confirm_password !== formState.profile.password
            ? 'Passwords do not match.'
            : 'Re-enter your password to confirm.'}
        </span>
      </label>
    </div>
  );

  const renderBusinessStep = () => (
    <div className="grid gap-3">
      <label className="text-sm text-gray-700">
        Business name *
        <input
          value={formState.business.business_name}
          onChange={(e) => patchNested('business', { business_name: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="text-sm text-gray-700">
        Business category *
        <select
          multiple
          value={formState.business.category_ids}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
            patchNested('business', { category_ids: selected, business_type_ids: [] });
          }}
          className="mt-1 h-36 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm text-gray-700">
        Business type *
        <select
          multiple
          value={formState.business.business_type_ids}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
            patchNested('business', { business_type_ids: selected });
          }}
          className="mt-1 h-36 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {businessTypes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm text-gray-700">
        Business registration *
        <select
          value={formState.business.registration_type}
          onChange={(e) => patchNested('business', { registration_type: e.target.value as RegistrationType })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="UNREGISTERED">Unregistered</option>
          <option value="REGISTERED_NON_VAT">Registered (NON VAT)</option>
          <option value="REGISTERED_VAT">Registered (VAT Included)</option>
        </select>
      </label>
    </div>
  );

  const renderLocationStep = () => (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="text-sm text-gray-700">
        House number *
        <input
          value={formState.location.house_number}
          onChange={(e) => patchNested('location', { house_number: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-sm text-gray-700">
        Street name *
        <input
          value={formState.location.street_name}
          onChange={(e) => patchNested('location', { street_name: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-sm text-gray-700">
        Barangay *
        <input
          value={formState.location.barangay}
          onChange={(e) => patchNested('location', { barangay: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-sm text-gray-700">
        City / Municipality *
        <input
          value={formState.location.city_municipality}
          onChange={(e) => patchNested('location', { city_municipality: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-sm text-gray-700">
        Province *
        <input
          value={formState.location.province}
          onChange={(e) => patchNested('location', { province: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-sm text-gray-700">
        Zip code *
        <input
          value={formState.location.zip_code}
          onChange={(e) => patchNested('location', { zip_code: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="text-sm text-gray-700">
        Latitude *
        <input value={formState.location.latitude} readOnly className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm" />
      </label>
      <label className="text-sm text-gray-700">
        Longitude *
        <input value={formState.location.longitude} readOnly className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm" />
      </label>

      <div className="md:col-span-2">
        <button
          type="button"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
          onClick={() => setShowMap(true)}
        >
          Choose Location on Map
        </button>
      </div>
    </div>
  );

  const renderDocumentsStep = () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-300 bg-white p-3">
        <h4 className="font-semibold text-gray-900 mb-2">Selfie with ID *</h4>
        <SelfieCapture
          value={formState.documents.selfie_with_id}
          onCapture={(dataUrl, detected) => {
            setSelfieFaceValid(detected);
            patchNested('documents', { selfie_with_id: dataUrl });
            void (async () => {
              try {
                const selfieFile = await dataUrlToFile(dataUrl, 'selfie-with-id.jpg');
                await uploadDocument('SELFIE_WITH_ID', selfieFile, false);
              } catch {
                setError('Failed to process selfie capture for upload.');
              }
            })();
          }}
        />
        {uploadingDocTypes.includes('SELFIE_WITH_ID') ? (
          <p className="mt-2 text-xs text-blue-600">Uploading selfie with ID...</p>
        ) : null}
      </div>

      <div className="space-y-2">
        {stepDocuments
          .filter((item) => item.type !== 'SELFIE_WITH_ID')
          .map((item) => {
            const existing = formState.documents.items.find((entry) => entry.document_type === item.type);
            return (
              <div key={item.type} className="rounded-lg border border-gray-300 bg-white p-3">
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  {item.label} {item.required ? '*' : '(Optional)'}
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) {
                      return;
                    }
                    const maxSize = 5 * 1024 * 1024;
                    if (file.size > maxSize) {
                      setError(`${item.label} exceeds 5MB size limit.`);
                      return;
                    }
                    void uploadDocument(item.type, file, !item.required);
                  }}
                  className="block w-full text-sm text-gray-600"
                />
                <p className="mt-2 text-xs text-gray-500">{existing ? `Uploaded: ${existing.file_url}` : 'No file uploaded.'}</p>
                {uploadingDocTypes.includes(item.type) ? (
                  <p className="mt-1 text-xs text-blue-600">Uploading...</p>
                ) : null}
              </div>
            );
          })}
      </div>
    </div>
  );

  const renderVerificationStep = () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <h4 className="font-semibold text-gray-900">Summary</h4>
        <p className="mt-2 text-sm text-gray-600">Review your profile, business, location, and document entries before final submission.</p>
      </div>

      <button
        type="button"
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        onClick={requestVerificationOtp}
      >
        Send / Resend OTP
      </button>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-gray-700">
          Email OTP *
          <input
            value={formState.verification.email_otp}
            onChange={(e) => patchNested('verification', { email_otp: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm text-gray-700">
          Phone OTP *
          <input
            value={formState.verification.phone_otp}
            onChange={(e) => patchNested('verification', { phone_otp: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="space-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formState.verification.terms_accepted}
            onChange={(e) => patchNested('verification', { terms_accepted: e.target.checked })}
          />
          <span>
            I agree to the{' '}
            <button type="button" className="text-primary-600 underline" onClick={() => setShowTermsModal(true)}>
              Terms and Conditions
            </button>
            {' '}and acknowledge legal review is required.
          </span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formState.verification.privacy_accepted}
            onChange={(e) => patchNested('verification', { privacy_accepted: e.target.checked })}
          />
          <span>
            I agree to the{' '}
            <button type="button" className="text-primary-600 underline" onClick={() => setShowPrivacyModal(true)}>
              Privacy Policy
            </button>
            {' '}and acknowledge legal review is required.
          </span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Merchant Setup Wizard</h1>
        <p className="mb-6 text-sm text-gray-600">Complete all 5 steps. Final data submission happens only at Step 5.</p>

        {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div> : null}
        {info ? <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{info}</div> : null}

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
          submitting={saving || uploadingDocTypes.length > 0}
        >
          {currentStep === 0 ? renderProfileStep() : null}
          {currentStep === 1 ? renderBusinessStep() : null}
          {currentStep === 2 ? renderLocationStep() : null}
          {currentStep === 3 ? renderDocumentsStep() : null}
          {currentStep === 4 ? renderVerificationStep() : null}
        </Wizard>
      </div>

      <LeafletMapModal
        open={showMap}
        onClose={() => setShowMap(false)}
        latitude={formState.location.latitude}
        longitude={formState.location.longitude}
        onSave={(lat, lng) => patchNested('location', { latitude: lat, longitude: lng })}
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
            <button className="rounded-lg border border-gray-300 px-3 py-2 text-sm" onClick={() => setShowSubmitConfirm(false)}>
              Cancel
            </button>
            <button className="rounded-lg bg-primary-500 px-3 py-2 text-sm font-semibold text-white" onClick={confirmSubmit}>
              Confirm Submit
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
