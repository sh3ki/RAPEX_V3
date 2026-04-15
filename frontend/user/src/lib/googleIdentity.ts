type GoogleCredentialHandler = (idToken: string) => void;

const GOOGLE_SCRIPT_ID = 'google-identity-script';

const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if ((window as any).google?.accounts?.id) {
        resolve();
      } else {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Failed to load Google script.')), { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google script.'));
    document.head.appendChild(script);
  });
};

export const renderGoogleButton = async (
  container: HTMLDivElement,
  clientId: string,
  onCredential: GoogleCredentialHandler,
): Promise<void> => {
  await loadGoogleScript();

  const google = (window as any).google;
  if (!google?.accounts?.id) {
    throw new Error('Google Identity Services is unavailable.');
  }

  google.accounts.id.initialize({
    client_id: clientId,
    callback: (response: { credential?: string }) => {
      if (response?.credential) {
        onCredential(response.credential);
      }
    },
  });

  container.innerHTML = '';
  google.accounts.id.renderButton(container, {
    type: 'standard',
    shape: 'pill',
    theme: 'outline',
    text: 'continue_with',
    size: 'large',
    width: 320,
  });
};
