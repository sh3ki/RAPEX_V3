'use client';

import { File as FileIcon, Upload, X } from 'lucide-react';
import { useRef } from 'react';

interface FileUploadProps {
  label?: string;
  files: globalThis.File[];
  onFilesChange: (files: globalThis.File[]) => void;
  accept?: string;
  multiple?: boolean;
}

export function FileUpload({
  label,
  files,
  onFilesChange,
  accept,
  multiple = true,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(newFiles: FileList | null): void {
    if (!newFiles) {
      return;
    }
    const incoming = Array.from(newFiles);
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
        Drag and drop files here, or click to browse
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(event) => addFiles(event.target.files)}
      />
      <div className="space-y-1">
        {files.map((fileItem, index) => (
          <div key={`${fileItem.name}-${index}`} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <FileIcon size={14} />
              <span className="truncate">{fileItem.name}</span>
            </div>
            <button
              type="button"
              onClick={() => onFilesChange(files.filter((_, i) => i !== index))}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
