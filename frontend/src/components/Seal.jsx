export default function Seal({ status, labelOverrides = {} }) {
  const map = {
    open: { cls: 'seal-open', label: 'Open' },
    closed: { cls: 'seal-closed', label: 'Closed' },
    pending: { cls: 'seal-pending', label: 'Pending' },
    accepted: { cls: 'seal-accepted', label: 'Accepted' },
    rejected: { cls: 'seal-rejected', label: 'Rejected' },
  };
  const entry = map[status] || map.pending;
  const label = labelOverrides[status] || entry.label;

  return <span className={`seal ${entry.cls}`}>{label}</span>;
}
