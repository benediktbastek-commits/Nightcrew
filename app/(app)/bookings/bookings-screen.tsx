'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Screen } from '@/components/screen';
import { Chip, Segmented } from '@/components/ui';
import { dateParts, formatDayMonth, formatEuro, formatTimeRange } from '@/lib/format';
import type { Contact, Gig, GigStatus } from '@/lib/types';
import { confirmAdvance } from './actions';

const FILTERS = ['ALLE', 'BESTÄTIGT', 'ANGEFRAGT'] as const;

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

export function BookingsScreen({ gigs, contacts }: { gigs: Gig[]; contacts: Contact[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALLE');
  const [openGigId, setOpenGigId] = useState<string | null>(null);

  const filtered = gigs.filter((gig) => {
    if (filter === 'BESTÄTIGT') return gig.status === 'confirmed';
    if (filter === 'ANGEFRAGT') return gig.status === 'requested';
    return true;
  });

  const feeSum = filtered.reduce((sum, gig) => sum + gig.fee_cents, 0);
  const openGig = gigs.find((gig) => gig.id === openGigId) ?? null;
  const openGigContact = openGig ? contacts.find((contact) => contact.id === openGig.contact_id) : null;

  return (
    <Screen title="BOOKINGS">
      <Segmented labels={[...FILTERS]} value={filter} onChange={(label) => setFilter(label as (typeof FILTERS)[number])} />
      <div className="row list-meta">
        <span className="label">{String(filtered.length).padStart(2, '0')} TERMINE</span>
        <span className="label">GAGE ∑ {formatEuro(feeSum)}</span>
      </div>

      {filtered.length === 0 ? (
        <p className="empty-state">Keine Gigs in dieser Ansicht.</p>
      ) : (
        <div className="list">
          {filtered.map((gig) => {
            const { weekday, day, month } = dateParts(gig.date);
            return (
              <button className={`gig-row${gig.status === 'option' ? ' option' : ''}`} key={gig.id} onClick={() => setOpenGigId(gig.id)}>
                <div className="date"><span>{weekday}</span><b>{day}</b><span>{month}</span></div>
                <div className="divider" />
                <div className="grow">
                  <strong>{gig.venue}</strong>
                  <span className="gig-row-time">{gig.city} · {formatTimeRange(gig.set_start, gig.set_end)}</span>
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

      <Link href="/bookings/new" className="claude-link">+ NEUEN GIG ANLEGEN <span>›</span></Link>

      {openGig && (
        <div className="sheet-backdrop" onClick={() => setOpenGigId(null)}>
          <div className="sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="row">
              <h2 className="sheet-title">{openGig.venue}</h2>
              <Chip tone={STATUS_TONE[openGig.status]}>{STATUS_LABEL[openGig.status]}</Chip>
            </div>
            <div className="row">
              <span className="muted">{openGig.city} / {dateParts(openGig.date).weekday} {formatDayMonth(openGig.date)} / {formatTimeRange(openGig.set_start, openGig.set_end)}</span>
              <Link href={`/bookings/${openGig.id}/edit`} className="edit-link">BEARBEITEN</Link>
            </div>
            <div className="kv-list">
              <div className="kv-row"><span className="kv-key">GAGE</span><span className="kv-value">{formatEuro(openGig.fee_cents)}</span></div>
              <div className="kv-row"><span className="kv-key">KONTAKT</span><span className="kv-value">{openGigContact?.name ?? '—'}</span></div>
              <div className="kv-row"><span className="kv-key">TECHNIK</span><span className="kv-value">{openGig.tech_notes || '—'}</span></div>
              <div className="kv-row"><span className="kv-key">HOTEL</span><span className="kv-value">{openGig.hotel || '—'}</span></div>
              <div className="kv-row"><span className="kv-key">ANREISE</span><span className="kv-value">{openGig.travel || '—'}</span></div>
            </div>
            <div className="button-row">
              {openGig.advance_confirmed ? (
                <span className="button solid-button">✓ ADVANCE BESTÄTIGT</span>
              ) : (
                <form action={confirmAdvance.bind(null, openGig.id)}>
                  <button type="submit" className="button solid-button">ADVANCE BESTÄTIGEN</button>
                </form>
              )}
              <button className="button" onClick={() => setOpenGigId(null)}>SCHLIESSEN</button>
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
}
