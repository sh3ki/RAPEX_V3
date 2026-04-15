'use client';

const PRESET_COLORS = ['#7C3AED', '#A78BFA', '#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#111827'];

interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      {label ? <label className="text-sm font-medium text-gray-700">{label}</label> : null}
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-12 rounded-lg border border-gray-300 bg-white" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            style={{ backgroundColor: preset }}
            className="h-6 w-6 rounded-full border border-white ring-2 ring-gray-200"
            aria-label={`Pick ${preset}`}
          />
        ))}
      </div>
    </div>
  );
}
