'use client';

import { ChevronLeft, ChevronRight, Image as ImageIcon, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { organizeUploadSelection } from '../../utils/upload';

interface MultiImageUploadCarouselProps {
  label?: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  existingUrls?: string[];
  maxFiles?: number;
  accept?: string;
}

export function MultiImageUploadCarousel({
  label,
  files,
  onFilesChange,
  existingUrls = [],
  maxFiles = 2,
  accept = 'image/*',
}: MultiImageUploadCarouselProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const localPreviews = useMemo(
    () =>
      files.map((fileItem) => ({
        key: `${fileItem.name}-${fileItem.size}-${fileItem.lastModified}`,
        url: URL.createObjectURL(fileItem),
        name: fileItem.name,
        isLocal: true,
      })),
    [files],
  );

  useEffect(() => {
    return () => {
      localPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [localPreviews]);

  const slides = useMemo(() => {
    if (localPreviews.length > 0) {
      return localPreviews;
    }
    return existingUrls.map((url, index) => ({
      key: `existing-${index}`,
      url,
      name: `Existing image ${index + 1}`,
      isLocal: false,
    }));
  }, [existingUrls, localPreviews]);

  useEffect(() => {
    if (!slides.length) {
      setActiveIndex(0);
      return;
    }
    if (activeIndex > slides.length - 1) {
      setActiveIndex(slides.length - 1);
    }
  }, [activeIndex, slides.length]);

  function addFiles(newFiles: FileList | null): void {
    if (!newFiles) {
      return;
    }

    const incoming = Array.from(newFiles);
    const nextFiles = organizeUploadSelection(files, incoming, {
      multiple: true,
      onlyImages: true,
      maxFiles,
      sortOrder: 'name',
    });

    onFilesChange(nextFiles);
    if (nextFiles.length > 0) {
      setActiveIndex(nextFiles.length - 1);
    }
  }

  function removeAt(index: number): void {
    const next = files.filter((_, i) => i !== index);
    onFilesChange(next);
    setActiveIndex((prev) => {
      if (next.length === 0) {
        return 0;
      }
      return Math.min(prev, next.length - 1);
    });
  }

  const currentSlide = slides[activeIndex];

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
        <p className="mt-1 text-xs text-slate-500">Up to {maxFiles} images. PNG, JPEG, and WEBP are supported.</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(event) => {
          addFiles(event.target.files);
          event.currentTarget.value = '';
        }}
      />

      {currentSlide ? (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <img src={currentSlide.url} alt={currentSlide.name} className="h-52 w-full object-cover" />
            {currentSlide.isLocal ? (
              <button
                type="button"
                onClick={() => removeAt(activeIndex)}
                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/80 bg-white/95 text-slate-600 shadow hover:text-slate-900"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
            <div className="inline-flex items-center gap-1.5">
              <ImageIcon size={12} />
              <span className="truncate">{currentSlide.name}</span>
            </div>
            <span>
              {activeIndex + 1} / {slides.length}
            </span>
          </div>

          {slides.length > 1 ? (
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeIndex === 0}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={12} />
                Previous
              </button>
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => Math.min(slides.length - 1, prev + 1))}
                disabled={activeIndex === slides.length - 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight size={12} />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
