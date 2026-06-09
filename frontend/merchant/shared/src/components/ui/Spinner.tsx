'use client';

import { cn } from '../../utils/cn';

interface SpinnerProps {
  fullScreen?: boolean;
  label?: string;
  className?: string;
}

export function Spinner({
  fullScreen = false,
  label = 'Loading...',
  className,
}: SpinnerProps) {
  const spinner = (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary-500" />
      <p className="text-sm font-medium text-gray-500">{label}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/75 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}
