'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { ShieldAlert, Plus } from 'lucide-react';

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
  const [showCreateCase, setShowCreateCase] = useState(false);
  const [showBlacklist, setShowBlacklist] = useState(false);
  const [caseForm, setCaseForm] = useState({ subject_id: '', subject_role: 'USER', title: '', priority: 'MEDIUM' });
  const [blacklistForm, setBlacklistForm] = useState({ subject_id: '', subject_role: 'USER', reason: '' });
  const queryClient = useQueryClient();

  const { data: flags = [], isLoading: loadingFlags } = useQuery<FlagRow[]>({
    queryKey: ['admin-fraud-flags'],
    queryFn: () => api.get('/admin-panel/fraud/flags/').then((r) => r.data),
    enabled: activeTab === 'flags',
  });

  const { data: cases = [], isLoading: loadingCases } = useQuery<CaseRow[]>({
    queryKey: ['admin-fraud-cases'],
    queryFn: () => api.get('/admin-panel/fraud/cases/').then((r) => r.data),
    enabled: activeTab === 'cases',
  });

  const createCaseMut = useMutation({
    mutationFn: () => api.post('/admin-panel/fraud/cases/create/', caseForm),
    onSuccess: (res) => {
      alert(`Case created: ${res.data.case_number}`);
      setShowCreateCase(false);
      setCaseForm({ subject_id: '', subject_role: 'USER', title: '', priority: 'MEDIUM' });
      queryClient.invalidateQueries({ queryKey: ['admin-fraud-cases'] });
    },
  });

  const blacklistMut = useMutation({
    mutationFn: () => api.post('/admin-panel/fraud/blacklist/', blacklistForm),
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="text-red-400" size={24} /> Fraud Management
            </h1>
            <p className="text-gray-500 text-sm mt-1">Flags, investigation cases, and blacklist</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreateCase(true)}>
              <Plus size={16} /> New Case
            </button>
            <button className="btn-secondary flex items-center gap-2" onClick={() => setShowBlacklist(true)}>
              Blacklist
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['flags', 'cases'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-500 hover:text-gray-900 border border-gray-200'
              }`}
            >
              {tab === 'flags' ? 'Fraud Flags' : 'Cases'}
            </button>
          ))}
        </div>

        {activeTab === 'flags' && (
          <DataTable columns={flagColumns} data={flags} page={1} totalPages={1} onPageChange={() => {}} isLoading={loadingFlags} />
        )}
        {activeTab === 'cases' && (
          <DataTable columns={caseColumns} data={cases} page={1} totalPages={1} onPageChange={() => {}} isLoading={loadingCases} />
        )}

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
