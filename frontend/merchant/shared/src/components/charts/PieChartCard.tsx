'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface PieChartCardProps<T extends Record<string, unknown>> {
  title: string;
  subtitle?: string;
  data: T[];
  dataKey: keyof T;
  nameKey: keyof T;
  colors?: string[];
}

const DEFAULT_COLORS = ['#7C3AED', '#A78BFA', '#22C55E', '#F59E0B', '#3B82F6', '#EF4444'];

export function PieChartCard<T extends Record<string, unknown>>({
  title,
  subtitle,
  data,
  dataKey,
  nameKey,
  colors = DEFAULT_COLORS,
}: PieChartCardProps<T>) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {subtitle ? <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p> : null}
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip />
            <Pie data={data} dataKey={dataKey as string} nameKey={nameKey as string} outerRadius={110} innerRadius={60}>
              {data.map((_, index) => (
                <Cell key={index} fill={colors[index % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
