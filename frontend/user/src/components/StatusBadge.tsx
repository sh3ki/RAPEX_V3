'use client';
interface StatusBadgeProps { status: string; }
const colorMap: Record<string, string> = {
  PENDING: 'badge-yellow', PLACED: 'badge-yellow', AWAITING_PICKUP: 'badge-yellow',
  ACTIVE: 'badge-blue', ACCEPTED: 'badge-blue', IN_TRANSIT: 'badge-blue', PROCESSING: 'badge-blue', PICKED_UP: 'badge-blue',
  COMPLETED: 'badge-green', DELIVERED: 'badge-green', APPROVED: 'badge-green', VERIFIED: 'badge-green', SUCCESS: 'badge-green',
  CANCELLED: 'badge-red', REJECTED: 'badge-red', FAILED: 'badge-red', FLAGGED: 'badge-red',
};
export default function StatusBadge({ status }: StatusBadgeProps) {
  const cls = colorMap[status?.toUpperCase()] || 'badge-blue';
  return <span className={cls}>{status}</span>;
}
