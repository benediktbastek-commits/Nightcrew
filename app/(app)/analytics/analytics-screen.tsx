'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Segmented } from '@/components/ui';
import { daysBetween, formatCompact, windowBucket } from '@/lib/format';
import type { AccountMetric, Import, PostPlatform } from '@/lib/types';

const RANGES = ['7 T', '30 T', '90 T'] as const;
const RANGE_DAYS: Record<(typeof RANGES)[number], 7 | 30 | 90> = { '7 T': 7, '30 T': 30, '90 T': 90 };
const PLATFORM_LABEL: Record<PostPlatform, string> = { instagram: 'INSTAGRAM', tiktok: 'TIKTOK', youtube: 'YOUTUBE', spotify: 'SPOTIFY' };

const METRICS: { key: keyof AccountMetric; label: string }[] = [
  { key: 'views', label: 'AUFRUFE' },
  { key: 'reach', label: 'BETRACHTER' },
  { key: 'likes', label: 'LIKES' },
  { key: 'comments', label: 'KOMMENTARE' },
  { key: 'reposts', label: 'REPOSTS' },
  { key: 'shares', label: 'GETEILT' },
  { key: 'saves', label: 'GESPEICHERT' },
  { key: 'profile_views', label: 'PROFILAUFRUFE' },
  { key: 'followers_delta', label: 'FOLLOWER' },
  { key: 'interactions', label: 'INTERAKTIONEN' },
];

const STALE_AFTER_DAYS = 10;

export function AnalyticsScreen({ metrics, lastImport }: { metrics: AccountMetric[]; lastImport: Import | null }) {
  const [range, setRange] = useState<(typeof RANGES)[number]>('30 T');
  const [metricKey, setMetricKey] = useState<keyof AccountMetric>('views');

  const today = new Date().toISOString().slice(0, 10);
  const bucket = RANGE_DAYS[range];

  // Pro Plattform genau der eine Screenshot, dessen Fenstergröße zum gewählten Zeitraum passt —
  // Werte aus unterschiedlichen Fenstergrößen werden nicht mehr addiert.
  const platforms = Array.from(new Set(metrics.map((m) => m.platform)));
  const matched = platforms
    .map((platform) => {
      const candidates = metrics.filter((m) => m.platform === platform && windowBucket(m.period_start, m.period_end) === bucket);
      const latest = candidates.sort((a, b) => b.period_end.localeCompare(a.period_end))[0];
      return latest ? { platform, row: latest } : null;
    })
    .filter((entry): entry is { platform: PostPlatform; row: AccountMetric } => entry !== null);

  const valueOf = (row: AccountMetric) => Number(row[metricKey]) || 0;
  const total = matched.reduce((sum, { row }) => sum + valueOf(row), 0);
  const maxPlatformValue = Math.max(...matched.map(({ row }) => valueOf(row)), 1);
  const oldestAge = matched.length > 0 ? Math.max(...matched.map(({ row }) => daysBetween(row.period_end, today))) : null;
  const metricLabel = METRICS.find((m) => m.key === metricKey)?.label ?? '';

  return (
    <>
      <Segmented labels={[...RANGES]} value={range} onChange={(label) => setRange(label as (typeof RANGES)[number])} />

      <Link href="/import" className="claude-link">
        <span>+ SCREENSHOT IMPORTIEREN{lastImport ? ` · zuletzt vor ${daysBetween(lastImport.created_at.slice(0, 10), today)} T` : ''}</span>
        <span>›</span>
      </Link>

      {matched.length === 0 ? (
        <p className="empty-state">Keine Zahlen für {range}. Importiere einen Screenshot mit diesem Zeitraum.</p>
      ) : (
        <>
          {oldestAge !== null && oldestAge > STALE_AFTER_DAYS && (
            <p className="stale-note warn">⚠ Letzter Import für {range} ist {oldestAge} Tage her — Zahlen könnten veraltet sein.</p>
          )}

          <div className="metric-picker">
            {METRICS.map((m) => (
              <button type="button" key={m.key} className={metricKey === m.key ? 'active' : ''} onClick={() => setMetricKey(m.key)}>
                {m.label}
              </button>
            ))}
          </div>

          <section className="panel stat-card">
            <span className="label">{metricLabel} · {range}</span>
            <div className="stat-value">{metricKey === 'followers_delta' && total >= 0 ? '+' : ''}{formatCompact(total)}</div>
          </section>

          <section>
            <div className="row section-heading"><span className="label">NACH PLATTFORM</span></div>
            {matched.length > 1 && (
              <div className="platform-row">
                <div className="platform-row-top">
                  <span className="platform-name bright">GESAMT</span>
                  <strong>{formatCompact(total)}</strong>
                </div>
                <div className="platform-track"><i style={{ width: '100%' }} /></div>
              </div>
            )}
            {matched
              .sort((a, b) => valueOf(b.row) - valueOf(a.row))
              .map(({ platform, row }) => {
                const age = daysBetween(row.period_end, today);
                return (
                  <div className="platform-row" key={platform}>
                    <div className="platform-row-top">
                      <span className="platform-name">{PLATFORM_LABEL[platform]}</span>
                      <strong>{formatCompact(valueOf(row))}</strong>
                    </div>
                    <div className="platform-track"><i style={{ width: `${(valueOf(row) / maxPlatformValue) * 100}%` }} /></div>
                    <span className={`stale-note${age > STALE_AFTER_DAYS ? ' warn' : ''}`}>{age === 0 ? 'HEUTE AKTUALISIERT' : `VOR ${age} T AKTUALISIERT`}</span>
                  </div>
                );
              })}
          </section>
        </>
      )}

      <section className="panel">
        <p className="muted">
          &quot;Bester Content&quot; und Trend-Vergleiche brauchen Post-Kennzahlen aus dem Post-Import (noch nicht gebaut).
        </p>
      </section>
    </>
  );
}
