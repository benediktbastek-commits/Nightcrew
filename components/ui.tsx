'use client';

export function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span className="label">{label}</span><strong>{value}</strong></div>;
}

export function Chip({ children, tone = 'outline' }: { children: React.ReactNode; tone?: 'solid' | 'outline' | 'dim' }) {
  return <span className={`chip ${tone}`}>{children}</span>;
}

export function Segmented({ labels, value, onChange }: { labels: string[]; value: string; onChange: (label: string) => void }) {
  return (
    <div className="segmented">
      {labels.map(label => (
        <button type="button" className={value === label ? 'active' : ''} onClick={() => onChange(label)} key={label}>
          {label}
        </button>
      ))}
    </div>
  );
}
