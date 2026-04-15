'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

interface LineChartCardProps<T extends Record<string, unknown>> {
  title: string;
  subtitle?: string;
  data: T[];
  xKey: keyof T;
  yKey: keyof T;
  stroke?: string;
}

export function LineChartCard<T extends Record<string, unknown>>({
  title,
  subtitle,
  data,
  xKey,
  yKey,
  stroke = '#7C3AED',
}: LineChartCardProps<T>) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {subtitle ? <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p> : null}
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey={xKey as string} tick={{ fill: '#6B7280', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey={yKey as string} stroke={stroke} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
