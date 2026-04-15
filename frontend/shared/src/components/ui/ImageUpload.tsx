'use client';

import { Image as ImageIcon, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useRef } from 'react';

interface ImageUploadProps {
  label?: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  multiple?: boolean;
}

export function ImageUpload({
  label,
  files,
  onFilesChange,
  multiple = true,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(() => {
    return files.map((fileItem) => ({
      file: fileItem,
      url: URL.createObjectURL(fileItem),
    }));
  }, [files]);

  function addFiles(newFiles: FileList | null): void {
    if (!newFiles) {
      return;
    }

    const incoming = Array.from(newFiles).filter((fileItem) => fileItem.type.startsWith('image/'));
    onFilesChange(multiple ? [...files, ...incoming] : incoming.slice(0, 1));
  }

  return (
    <div className="space-y-2">
      {label ? <label className="text-sm font-medium text-gray-700">{label}</label> : null}
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
        className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500"
      >
        <Upload className="mx-auto mb-2 text-gray-400" size={22} />
        Drag and drop images here, or click to browse
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(event) => addFiles(event.target.files)}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {previews.map((preview, index) => (
          <div key={`${preview.file.name}-${index}`} className="relative overflow-hidden rounded-lg border border-gray-200 bg-white">
            <Image
              src={preview.url}
              alt={preview.file.name}
              width={240}
              height={180}
              className="h-28 w-full object-cover"
              unoptimized
            />
            <div className="flex items-center justify-between border-t border-gray-100 px-2 py-1.5 text-xs text-gray-600">
              <div className="flex items-center gap-1 truncate">
                <ImageIcon size={12} />
                <span className="truncate">{preview.file.name}</span>
              </div>
              <button
                type="button"
                onClick={() => onFilesChange(files.filter((_, i) => i !== index))}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
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
