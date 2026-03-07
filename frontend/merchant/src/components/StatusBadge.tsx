const styles: Record<string, string> = {
  active: 'badge-green', approved: 'badge-green', delivered: 'badge-green', completed: 'badge-green', open: 'badge-green',
  pending: 'badge-yellow', pending_merchant: 'badge-yellow', processing: 'badge-yellow', preparing: 'badge-yellow', cooking: 'badge-yellow',
  in_transit: 'badge-blue', assigned: 'badge-blue', picked_up: 'badge-blue',
  rejected: 'badge-red', cancelled: 'badge-red', closed: 'badge-red', sold: 'badge-red',
};

export default function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase().replace(/\s+/g, '_');
  return <span className={styles[key] || 'badge-blue'}>{status.replace(/_/g, ' ')}</span>;
}
