'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Chip } from '@/components/ui';
import { dateParts, formatDayMonth, formatEuro, formatTimeRange } from '@/lib/format';
import type { Gig, GigStatus } from '@/lib/types';

const STATUS_LABEL: Record<GigStatus, string> = {
  confirmed: 'BESTÄTIGT',
  requested: 'ANGEFRAGT',
  option: 'OPTION',
};

const STATUS_TONE: Record<GigStatus, 'solid' | 'outline' | 'dim'> = {
  confirmed: 'solid',
  requested: 'outline',
  option: 'dim',
};

export function PhotographerBookingsScreen({ gigs }: { gigs: Gig[] }) {
  const [openGigId, setOpenGigId] = useState<string | null>(null);
  const openGig = gigs.find((gig) => gig.id === openGigId) ?? null;

  return (
    <>
      <div className="row list-meta">
        <span className="label">{String(gigs.length).padStart(2, '0')} AUFTRÄGE</span>
        <span className="label">GAGE ∑ {formatEuro(gigs.reduce((sum, gig) => sum + gig.fee_cents, 0))}</span>
      </div>

      {gigs.length === 0 ? (
        <p className="empty-state">Noch keine Aufträge. Angenommene Anfragen aus dem Marktplatz erscheinen hier automatisch.</p>
      ) : (
        <div className="list">
          {gigs.map((gig) => {
            const { weekday, day, month } = dateParts(gig.date);
            return (
              <button className="gig-row" key={gig.id} onClick={() => setOpenGigId(gig.id)}>
                <div className="date"><span>{weekday}</span><b>{day}</b><span>{month}</span></div>
                <div className="divider" />
                <div className="grow">
                  <strong>{gig.venue}</strong>
                  <span className="gig-row-time">{gig.city}{gig.set_start ? ` · ${formatTimeRange(gig.set_start, gig.set_end)}` : ''}</span>
                </div>
                <div className="gig-side">
                  <Chip tone={STATUS_TONE[gig.status]}>{STATUS_LABEL[gig.status]}</Chip>
                  <span className="gig-row-fee">{formatEuro(gig.fee_cents)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Link href="/bookings/new" className="claude-link">+ AUFTRAG ANLEGEN <span>›</span></Link>

      {openGig && (
        <div className="sheet-backdrop" onClick={() => setOpenGigId(null)}>
          <div className="sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="row">
              <h2 className="sheet-title">{openGig.venue}</h2>
              <Chip tone={STATUS_TONE[openGig.status]}>{STATUS_LABEL[openGig.status]}</Chip>
            </div>
            <p className="muted">{openGig.city} / {dateParts(openGig.date).weekday} {formatDayMonth(openGig.date)}</p>
            <div className="kv-list">
              <div className="kv-row"><span className="kv-key">GAGE</span><span className="kv-value">{formatEuro(openGig.fee_cents)}</span></div>
              <div className="kv-row"><span className="kv-key">NOTIZEN</span><span className="kv-value">{openGig.tech_notes || '—'}</span></div>
            </div>
            <div className="button-row">
              <Link href={`/bookings/${openGig.id}/edit`} className="button">BEARBEITEN</Link>
              <button className="button" onClick={() => setOpenGigId(null)}>SCHLIESSEN</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
