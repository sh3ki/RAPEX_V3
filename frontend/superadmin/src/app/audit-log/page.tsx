'use client';

import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import DataTable from '@/components/DataTable';
import api from '@/lib/api';
import { ScrollText } from 'lucide-react';

interface AuditRow {
  source: string;
  admin_id: string;
  action: string;
  target_type: string;
  created_at: string;
}

export default function AuditLogPage() {
  const { data: logs = [], isLoading } = useQuery<AuditRow[]>({
    queryKey: ['sa-audit-log'],
    queryFn: () => api.get('/superadmin/audit-log/').then((r) => r.data),
  });

  const columns = [
    {
      key: 'source',
      label: 'Source',
      render: (r: AuditRow) => (
        <span className={r.source === 'superadmin' ? 'badge-red' : 'badge-blue'}>
          {r.source}
        </span>
      ),
    },
    { key: 'admin_id', label: 'Admin', render: (r: AuditRow) => r.admin_id.slice(0, 8) + '...' },
    { key: 'action', label: 'Action' },
    { key: 'target_type', label: 'Target' },
    {
      key: 'created_at',
      label: 'Time',
      render: (r: AuditRow) => new Date(r.created_at).toLocaleString(),
    },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ScrollText size={24} className="text-primary" /> Audit Log
          </h1>
          <p className="text-dark-muted text-sm mt-1">Combined SuperAdmin & Admin activity log</p>
        </div>

        <DataTable columns={columns} data={logs} page={1} totalPages={1} onPageChange={() => {}} isLoading={isLoading} />
      </main>
    </div>
  );
}
