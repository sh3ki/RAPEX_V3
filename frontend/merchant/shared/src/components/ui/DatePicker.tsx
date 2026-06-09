'use client';

interface DatePickerProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
}

export function DatePicker({ label, value, onChange, min, max }: DatePickerProps) {
  return (
    <div className="space-y-1.5">
      {label ? <label className="text-sm font-medium text-gray-700">{label}</label> : null}
      <input
        type="date"
        value={value ?? ''}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      />
    </div>
  );
}
