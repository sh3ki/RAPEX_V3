'use client';

import { Upload } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef } from 'react';
import { cn } from '../../utils/cn';

interface ProfileImageUploadProps {
  label?: string;
  file: File | null;
  remoteImageUrl?: string;
  initials?: string;
  disabled?: boolean;
  onFileChange: (file: File | null) => void;
}

export function ProfileImageUpload({
  label = 'Profile Image',
  file,
  remoteImageUrl,
  initials = 'M',
  disabled = false,
  onFileChange,
}: ProfileImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const localPreviewUrl = useMemo(() => {
    if (!file) {
      return '';
    }
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const previewSrc = localPreviewUrl || remoteImageUrl || '';

  function pickFile(nextFiles: FileList | null): void {
    if (!nextFiles || !nextFiles.length) {
      return;
    }
    const candidate = nextFiles[0];
    if (!candidate.type.startsWith('image/')) {
      return;
    }
    onFileChange(candidate);
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">{label}</label>

      <div
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        onClick={() => {
          if (!disabled) {
            inputRef.current?.click();
          }
        }}
        onKeyDown={(event) => {
          if (disabled) {
            return;
          }
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          if (!disabled) {
            event.preventDefault();
          }
        }}
        onDrop={(event) => {
          if (disabled) {
            return;
          }
          event.preventDefault();
          pickFile(event.dataTransfer.files);
        }}
        className={cn(
          'flex items-center gap-4 rounded-2xl border-2 border-dashed px-4 py-3 transition-all',
          disabled
            ? 'cursor-not-allowed border-slate-200 bg-slate-100'
            : 'border-slate-300 bg-gradient-to-br from-white to-slate-50 hover:border-primary-400 hover:bg-primary-50/30',
        )}
      >
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-primary-50 text-lg font-bold text-primary-700">
          {previewSrc ? (
            <Image src={previewSrc} alt="Profile preview" fill className="object-cover" unoptimized />
          ) : (
            initials
          )}
        </div>

        <div className="flex-1">
          <p className="text-[1.35rem] font-semibold leading-6 text-slate-800">Drag and drop image</p>
          <p className="mt-1 text-sm text-slate-500">or click to select</p>
        </div>

        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-500 shadow-sm">
          <Upload size={18} />
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => pickFile(event.target.files)}
      />
    </div>
  );
}