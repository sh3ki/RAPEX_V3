'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DataTable from '@/components/DataTable';
import api from '@/lib/api';
import { ScrollText } from 'lucide-react';
import { TablePageLayout, TableRowDetailsModal } from '@shared/components/table';

interface AuditRow {
  source: string;
  admin_id: string;
  action: string;
  target_type: string;
  created_at: string;
}

export default function AuditLogPage() {
  const [selectedLog, setSelectedLog] = useState<AuditRow | null>(null);

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
    <DashboardLayout>
      <TablePageLayout
        title="Audit Log"
        subtitle="Combined SuperAdmin and Admin activity log"
        breadcrumbs={[{ label: 'SuperAdmin Dashboard', href: '/dashboard' }, { label: 'Audit Log' }]}
      >
        <DataTable loading={isLoading} columns={columns} data={logs} onRowClick={(row) => setSelectedLog(row)} />
      </TablePageLayout>

      <TableRowDetailsModal
        open={Boolean(selectedLog)}
        title="Audit Event Details"
        onClose={() => setSelectedLog(null)}
        rows={selectedLog ? [
          { label: 'Source', value: selectedLog.source },
          { label: 'Admin ID', value: selectedLog.admin_id },
          { label: 'Action', value: selectedLog.action },
          { label: 'Target', value: selectedLog.target_type },
          { label: 'Created At', value: new Date(selectedLog.created_at).toLocaleString() },
        ] : []}
      />
    </DashboardLayout>
  );
}
