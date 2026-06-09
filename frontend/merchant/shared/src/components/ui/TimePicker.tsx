'use client';

interface TimePickerProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  step?: number;
}

export function TimePicker({ label, value, onChange, step = 300 }: TimePickerProps) {
  return (
    <div className="space-y-1.5">
      {label ? <label className="text-sm font-medium text-gray-700">{label}</label> : null}
      <input
        type="time"
        value={value ?? ''}
        step={step}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      />
    </div>
  );
}
