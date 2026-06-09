'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { Plus } from 'lucide-react';
import { TablePageLayout, TableRowDetailsModal } from '@shared/components/table';

interface FlagRow {
  id: string;
  flag_type: string;
  subject_role: string;
  resolution: string;
  created_at: string;
}

interface CaseRow {
  id: string;
  case_number: string;
  priority: string;
  status: string;
  created_at: string;
}

export default function FraudPage() {
  const [activeTab, setActiveTab] = useState<'flags' | 'cases' | 'blacklist'>('flags');
  const [selectedFlag, setSelectedFlag] = useState<FlagRow | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseRow | null>(null);
  const [showCreateCase, setShowCreateCase] = useState(false);
  const [showBlacklist, setShowBlacklist] = useState(false);
  const [caseForm, setCaseForm] = useState({ subject_id: '', subject_role: 'USER', title: '', priority: 'MEDIUM' });
  const [blacklistForm, setBlacklistForm] = useState({ subject_id: '', subject_role: 'USER', reason: '' });
  const queryClient = useQueryClient();

  const { data: flags = [], isLoading: loadingFlags } = useQuery<FlagRow[]>({
    queryKey: ['admin-fraud-flags'],
    queryFn: () => api.get('/admin/fraud/flags/').then((r) => r.data),
    enabled: activeTab === 'flags',
  });

  const { data: cases = [], isLoading: loadingCases } = useQuery<CaseRow[]>({
    queryKey: ['admin-fraud-cases'],
    queryFn: () => api.get('/admin/fraud/cases/').then((r) => r.data),
    enabled: activeTab === 'cases',
  });

  const createCaseMut = useMutation({
    mutationFn: () => api.post('/admin/fraud/cases/create/', caseForm),
    onSuccess: (res) => {
      alert(`Case created: ${res.data.case_number}`);
      setShowCreateCase(false);
      setCaseForm({ subject_id: '', subject_role: 'USER', title: '', priority: 'MEDIUM' });
      queryClient.invalidateQueries({ queryKey: ['admin-fraud-cases'] });
    },
  });

  const blacklistMut = useMutation({
    mutationFn: () => api.post('/admin/fraud/blacklist/', blacklistForm),
    onSuccess: () => {
      alert('Account blacklisted');
      setShowBlacklist(false);
      setBlacklistForm({ subject_id: '', subject_role: 'USER', reason: '' });
    },
  });

  const flagColumns = [
    { key: 'flag_type', label: 'Type' },
    { key: 'subject_role', label: 'Role' },
    { key: 'resolution', label: 'Resolution', render: (r: FlagRow) => <StatusBadge status={r.resolution} /> },
    { key: 'created_at', label: 'Date', render: (r: FlagRow) => new Date(r.created_at).toLocaleDateString() },
  ];

  const caseColumns = [
    { key: 'case_number', label: 'Case #' },
    { key: 'priority', label: 'Priority', render: (r: CaseRow) => <StatusBadge status={r.priority} /> },
    { key: 'status', label: 'Status', render: (r: CaseRow) => <StatusBadge status={r.status} /> },
    { key: 'created_at', label: 'Date', render: (r: CaseRow) => new Date(r.created_at).toLocaleDateString() },
  ];

  return (
    <DashboardLayout>
      <TablePageLayout
        title="Fraud Management"
        subtitle="Flags, investigation cases, and blacklist"
        breadcrumbs={[{ label: 'Admin Dashboard', href: '/dashboard' }, { label: 'Fraud' }]}
        actionSlot={
          <div className="flex gap-2">
            <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreateCase(true)}>
              <Plus size={16} /> New Case
            </button>
            <button className="btn-secondary flex items-center gap-2" onClick={() => setShowBlacklist(true)}>
              Blacklist
            </button>
          </div>
        }
      >
        {activeTab === 'flags' ? (
          <DataTable
            columns={flagColumns}
            data={flags}
            loading={loadingFlags}
            tabs={[
              { value: 'flags', label: 'Fraud Flags', count: flags.length },
              { value: 'cases', label: 'Cases', count: cases.length },
            ]}
            activeTab="flags"
            onTabChange={(value) => setActiveTab(value as 'flags' | 'cases')}
            filterByTab={() => true}
            onRowClick={(row) => setSelectedFlag(row)}
          />
        ) : (
          <DataTable
            columns={caseColumns}
            data={cases}
            loading={loadingCases}
            tabs={[
              { value: 'flags', label: 'Fraud Flags', count: flags.length },
              { value: 'cases', label: 'Cases', count: cases.length },
            ]}
            activeTab="cases"
            onTabChange={(value) => setActiveTab(value as 'flags' | 'cases')}
            filterByTab={() => true}
            onRowClick={(row) => setSelectedCase(row)}
          />
        )}
      </TablePageLayout>

      <TableRowDetailsModal
        open={Boolean(selectedFlag)}
        title="Fraud Flag Details"
        onClose={() => setSelectedFlag(null)}
        rows={selectedFlag ? [
          { label: 'ID', value: selectedFlag.id },
          { label: 'Type', value: selectedFlag.flag_type },
          { label: 'Role', value: selectedFlag.subject_role },
          { label: 'Resolution', value: selectedFlag.resolution },
          { label: 'Created At', value: new Date(selectedFlag.created_at).toLocaleString() },
        ] : []}
      />

      <TableRowDetailsModal
        open={Boolean(selectedCase)}
        title="Investigation Case Details"
        onClose={() => setSelectedCase(null)}
        rows={selectedCase ? [
          { label: 'ID', value: selectedCase.id },
          { label: 'Case #', value: selectedCase.case_number },
          { label: 'Priority', value: selectedCase.priority },
          { label: 'Status', value: selectedCase.status },
          { label: 'Created At', value: new Date(selectedCase.created_at).toLocaleString() },
        ] : []}
      />

        {/* Create Case Modal */}
        {showCreateCase && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="card w-full max-w-md space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">New Investigation Case</h3>
              <input
                className="input"
                placeholder="Subject ID (UUID)"
                value={caseForm.subject_id}
                onChange={(e) => setCaseForm({ ...caseForm, subject_id: e.target.value })}
              />
              <select
                className="input"
                value={caseForm.subject_role}
                onChange={(e) => setCaseForm({ ...caseForm, subject_role: e.target.value })}
              >
                <option value="USER">User</option>
                <option value="MERCHANT">Merchant</option>
                <option value="RIDER">Rider</option>
              </select>
              <input
                className="input"
                placeholder="Case title"
                value={caseForm.title}
                onChange={(e) => setCaseForm({ ...caseForm, title: e.target.value })}
              />
              <select
                className="input"
                value={caseForm.priority}
                onChange={(e) => setCaseForm({ ...caseForm, priority: e.target.value })}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
              <div className="flex gap-3">
                <button
                  className="btn-primary flex-1"
                  onClick={() => createCaseMut.mutate()}
                  disabled={!caseForm.subject_id || !caseForm.title || createCaseMut.isPending}
                >
                  {createCaseMut.isPending ? 'Creating...' : 'Create Case'}
                </button>
                <button className="btn-secondary flex-1" onClick={() => setShowCreateCase(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Blacklist Modal */}
        {showBlacklist && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="card w-full max-w-md space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Blacklist Account</h3>
              <input
                className="input"
                placeholder="Subject ID (UUID)"
                value={blacklistForm.subject_id}
                onChange={(e) => setBlacklistForm({ ...blacklistForm, subject_id: e.target.value })}
              />
              <select
                className="input"
                value={blacklistForm.subject_role}
                onChange={(e) => setBlacklistForm({ ...blacklistForm, subject_role: e.target.value })}
              >
                <option value="USER">User</option>
                <option value="MERCHANT">Merchant</option>
                <option value="RIDER">Rider</option>
              </select>
              <textarea
                className="input h-20 resize-none"
                placeholder="Reason for blacklisting..."
                value={blacklistForm.reason}
                onChange={(e) => setBlacklistForm({ ...blacklistForm, reason: e.target.value })}
              />
              <div className="flex gap-3">
                <button
                  className="btn-primary flex-1 !bg-red-600 hover:!bg-red-700"
                  onClick={() => blacklistMut.mutate()}
                  disabled={!blacklistForm.subject_id || !blacklistForm.reason || blacklistMut.isPending}
                >
                  {blacklistMut.isPending ? 'Processing...' : 'Blacklist Account'}
                </button>
                <button className="btn-secondary flex-1" onClick={() => setShowBlacklist(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
    </DashboardLayout>
  );
}
