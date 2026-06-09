'use client';

import { Image as ImageIcon, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef } from 'react';
import { organizeUploadSelection, type UploadSortOrder } from '../../utils/upload';

interface ImageUploadProps {
  label?: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  helperText?: string;
  sortOrder?: UploadSortOrder;
  previewAspect?: 'default' | 'landscape';
  previewFit?: 'cover' | 'contain';
}

export function ImageUpload({
  label,
  files,
  onFilesChange,
  multiple = true,
  maxFiles,
  helperText,
  sortOrder = 'name',
  previewAspect = 'default',
  previewFit = 'cover',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(() => {
    return files.map((fileItem) => ({
      file: fileItem,
      url: URL.createObjectURL(fileItem),
    }));
  }, [files]);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  function addFiles(newFiles: FileList | null): void {
    if (!newFiles) {
      return;
    }

    const incoming = Array.from(newFiles);
    const nextFiles = organizeUploadSelection(files, incoming, {
      multiple,
      maxFiles,
      onlyImages: true,
      sortOrder,
    });
    onFilesChange(nextFiles);
  }

  return (
    <div className="space-y-2">
      {label ? <label className="text-sm font-semibold text-slate-700">{label}</label> : null}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          addFiles(event.dataTransfer.files);
        }}
        className="rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-white to-slate-50 p-6 text-center text-sm text-slate-500 transition-colors hover:border-primary-400 hover:bg-primary-50/30"
      >
        <Upload className="mx-auto mb-2 text-slate-400" size={22} />
        <p className="font-semibold text-slate-700">Drop images here or click to browse</p>
        <p className="mt-1 text-xs text-slate-500">{helperText || 'PNG, JPEG, and WEBP are supported.'}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(event) => {
          addFiles(event.target.files);
          event.currentTarget.value = '';
        }}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {previews.map((preview, index) => (
          <div key={`${preview.file.name}-${index}`} className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <Image
              src={preview.url}
              alt={preview.file.name}
              width={240}
              height={180}
              className={
                previewAspect === 'landscape'
                  ? `aspect-video w-full ${previewFit === 'contain' ? 'bg-slate-100 object-contain' : 'object-cover'}`
                  : `h-28 w-full ${previewFit === 'contain' ? 'bg-slate-100 object-contain' : 'object-cover'}`
              }
              unoptimized
            />
            <div className="flex items-center justify-between border-t border-slate-100 px-2 py-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-1 truncate">
                <ImageIcon size={12} />
                <span className="truncate">{preview.file.name}</span>
              </div>
              <button
                type="button"
                onClick={() => onFilesChange(files.filter((_, i) => i !== index))}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
