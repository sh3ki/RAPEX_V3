const statusStyles: Record<string, string> = {
  active: 'badge-green',
  approved: 'badge-green',
  delivered: 'badge-green',
  completed: 'badge-green',
  credited: 'badge-green',
  online: 'badge-green',
  pending: 'badge-yellow',
  pending_kyc: 'badge-yellow',
  processing: 'badge-yellow',
  in_progress: 'badge-yellow',
  assigned: 'badge-blue',
  picked_up: 'badge-blue',
  registered: 'badge-blue',
  qualified: 'badge-blue',
  rejected: 'badge-red',
  cancelled: 'badge-red',
  blacklisted: 'badge-red',
  suspended: 'badge-red',
  offline: 'badge-red',
  escalated: 'badge-red',
};

export default function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase().replace(/\s+/g, '_');
  const cls = statusStyles[key] || 'badge-blue';
  return <span className={cls}>{status.replace(/_/g, ' ')}</span>;
}
