'use client';

import { File as FileIcon, Upload, X } from 'lucide-react';
import { useRef } from 'react';
import { formatFileSize, organizeUploadSelection, type UploadSortOrder } from '../../utils/upload';

interface FileUploadProps {
  label?: string;
  files: globalThis.File[];
  onFilesChange: (files: globalThis.File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  helperText?: string;
  sortOrder?: UploadSortOrder;
}

export function FileUpload({
  label,
  files,
  onFilesChange,
  accept,
  multiple = true,
  maxFiles,
  helperText,
  sortOrder = 'name',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(newFiles: FileList | null): void {
    if (!newFiles) {
      return;
    }

    const incoming = Array.from(newFiles);
    const nextFiles = organizeUploadSelection(files, incoming, {
      multiple,
      maxFiles,
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
        <p className="font-semibold text-slate-700">Drop files here or click to browse</p>
        <p className="mt-1 text-xs text-slate-500">{helperText || 'Accepted format is based on form requirements.'}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(event) => {
          addFiles(event.target.files);
          event.currentTarget.value = '';
        }}
      />
      <div className="space-y-1">
        {files.map((fileItem, index) => (
          <div key={`${fileItem.name}-${index}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
            <div className="flex min-w-0 items-center gap-2 text-slate-700">
              <FileIcon size={14} />
              <div className="min-w-0">
                <p className="truncate font-medium">{fileItem.name}</p>
                <p className="text-xs text-slate-500">{formatFileSize(fileItem.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onFilesChange(files.filter((_, i) => i !== index))}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
