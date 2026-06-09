export type UploadSortOrder = 'name' | 'newest' | 'oldest';

interface UploadOrganizeOptions {
  multiple?: boolean;
  maxFiles?: number;
  onlyImages?: boolean;
  sortOrder?: UploadSortOrder;
}

function fileSignature(fileItem: globalThis.File) {
  return `${fileItem.name}::${fileItem.size}::${fileItem.lastModified}`;
}

function sortFiles(files: globalThis.File[], sortOrder: UploadSortOrder) {
  if (sortOrder === 'newest') {
    return [...files].sort((a, b) => b.lastModified - a.lastModified);
  }

  if (sortOrder === 'oldest') {
    return [...files].sort((a, b) => a.lastModified - b.lastModified);
  }

  return [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export function organizeUploadSelection(
  existingFiles: globalThis.File[],
  incomingFiles: globalThis.File[],
  {
    multiple = true,
    maxFiles,
    onlyImages = false,
    sortOrder = 'name',
  }: UploadOrganizeOptions = {},
) {
  const combined = multiple ? [...existingFiles, ...incomingFiles] : [...incomingFiles, ...existingFiles];

  const filtered = onlyImages ? combined.filter((fileItem) => fileItem.type.startsWith('image/')) : combined;

  const uniqueMap = new Map<string, globalThis.File>();
  for (const fileItem of filtered) {
    const signature = fileSignature(fileItem);
    if (!uniqueMap.has(signature)) {
      uniqueMap.set(signature, fileItem);
    }
  }

  const sorted = sortFiles(Array.from(uniqueMap.values()), sortOrder);
  const limit = multiple ? maxFiles || Number.MAX_SAFE_INTEGER : 1;
  return sorted.slice(0, Math.max(1, limit));
}

export function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const precision = size >= 10 || unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
}
