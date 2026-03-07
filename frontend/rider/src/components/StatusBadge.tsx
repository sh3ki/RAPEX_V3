'use client';
interface StatusBadgeProps { status: string; }
const colorMap: Record<string, string> = {
  PENDING: 'badge-yellow', PLACED: 'badge-yellow', AWAITING_PICKUP: 'badge-yellow', FOR_PICKUP: 'badge-yellow', READY_FOR_PICKUP: 'badge-yellow',
  ACTIVE: 'badge-blue', ACCEPTED: 'badge-blue', IN_TRANSIT: 'badge-blue', RIDER_ASSIGNED: 'badge-blue', PICKED_UP: 'badge-blue',
  COMPLETED: 'badge-green', DELIVERED: 'badge-green', ONLINE: 'badge-green',
  CANCELLED: 'badge-red', REJECTED: 'badge-red', OFFLINE: 'badge-red',
};
export default function StatusBadge({ status }: StatusBadgeProps) {
  const cls = colorMap[status?.toUpperCase()] || 'badge-blue';
  return <span className={cls}>{status}</span>;
}
