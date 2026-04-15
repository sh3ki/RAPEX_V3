'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface BarChartCardProps<T extends Record<string, unknown>> {
  title: string;
  subtitle?: string;
  data: T[];
  xKey: keyof T;
  yKey: keyof T;
  fill?: string;
}

export function BarChartCard<T extends Record<string, unknown>>({
  title,
  subtitle,
  data,
  xKey,
  yKey,
  fill = '#7C3AED',
}: BarChartCardProps<T>) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {subtitle ? <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p> : null}
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey={xKey as string} tick={{ fill: '#6B7280', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey={yKey as string} fill={fill} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
