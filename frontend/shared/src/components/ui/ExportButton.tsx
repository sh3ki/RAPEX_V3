'use client';

import { Download } from 'lucide-react';
import { Button } from './Button';

interface ExportButtonProps {
  onExport: () => void;
  label?: string;
}

export function ExportButton({ onExport, label = 'Export' }: ExportButtonProps) {
  return (
    <Button type="button" variant="secondary" onClick={onExport} className="gap-2">
      <Download size={16} />
      {label}
    </Button>
  );
}
