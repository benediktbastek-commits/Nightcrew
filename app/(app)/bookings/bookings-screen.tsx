'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Chip, Segmented } from '@/components/ui';
import { dateParts, formatDayMonth, formatEuro, formatTimeRange } from '@/lib/format';
import type { Contact, Gig, GigStatus } from '@/lib/types';
import { cancelGig, confirmAdvance } from './actions';

const FILTERS = ['ALLE', 'BESTÄTIGT', 'ANGEFRAGT'] as const;

const STATUS_LABEL: Record<GigStatus, string> = {
  confirmed: 'BESTÄTIGT',
  requested: 'ANGEFRAGT',
  option: 'OPTION',
  cancelled: 'ABGESAGT',
};

const STATUS_TONE: Record<GigStatus, 'solid' | 'outline' | 'dim'> = {
  confirmed: 'solid',
  requested: 'outline',
  option: 'dim',
  cancelled: 'dim',
};

export function BookingsScreen({ gigs, contacts, photographerConfirmedGigIds = [] }: { gigs: Gig[]; contacts: Contact[]; photographerConfirmedGigIds?: string[] }) {
  const confirmedSet = new Set(photographerConfirmedGigIds);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALLE');
  const [openGigId, setOpenGigId] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const upcomingGigs = gigs.filter((gig) => gig.date >= today);
  const pastGigs = gigs.filter((gig) => gig.date < today).slice().reverse();

  const filtered = upcomingGigs.filter((gig) => {
    if (filter === 'BESTÄTIGT') return gig.status === 'confirmed';
    if (filter === 'ANGEFRAGT') return gig.status === 'requested';
    return true;
  });

  const feeSum = filtered.reduce((sum, gig) => sum + gig.fee_cents, 0);
  const openGig = gigs.find((gig) => gig.id === openGigId) ?? null;
  const openGigContact = openGig ? contacts.find((contact) => contact.id === openGig.contact_id) : null;

  return (
    <>
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
                  {confirmedSet.has(gig.id) && <span className="stale-note">FOTO/VIDEO ✓</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Link href="/bookings/new" className="claude-link">+ NEUEN GIG ANLEGEN <span>›</span></Link>

      {pastGigs.length > 0 && (
        <section>
          <div className="row section-heading"><span className="label">VERGANGENE GIGS</span><span className="muted">{pastGigs.length}</span></div>
          {pastGigs.map((gig) => (
            <button className="platform-row" style={{ width: '100%', border: 0, background: 'transparent', cursor: 'pointer' }} key={gig.id} onClick={() => setOpenGigId(gig.id)}>
              <div className="platform-row-top">
                <span className="platform-name">{gig.venue} · {gig.city}</span>
                <Chip tone={STATUS_TONE[gig.status]}>{STATUS_LABEL[gig.status]}</Chip>
              </div>
              <p className="meta">{formatDayMonth(gig.date)} · {formatEuro(gig.fee_cents)}</p>
            </button>
          ))}
        </section>
      )}

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
              <div className="kv-row"><span className="kv-key">FOTO/VIDEO</span><span className="kv-value">{confirmedSet.has(openGig.id) ? '✓ Bestätigt' : '—'}</span></div>
            </div>
            {!confirmedSet.has(openGig.id) && openGig.status !== 'cancelled' && (
              <Link href={`/marketplace?gig=${openGig.id}#anfrage`} className="edit-link">AUF MARKTPLATZ POSTEN (FOTOGRAF SUCHEN)</Link>
            )}
            <div className="button-row">
              {openGig.status === 'cancelled' ? (
                <span className="button">ABGESAGT</span>
              ) : openGig.advance_confirmed ? (
                <span className="button solid-button">✓ ADVANCE BESTÄTIGT</span>
              ) : (
                <form action={confirmAdvance.bind(null, openGig.id)}>
                  <button type="submit" className="button solid-button">ADVANCE BESTÄTIGEN</button>
                </form>
              )}
              <button className="button" onClick={() => setOpenGigId(null)}>SCHLIESSEN</button>
            </div>
            {openGig.status !== 'cancelled' && (
              <form action={cancelGig.bind(null, openGig.id)}>
                <button type="submit" className="edit-link">GIG ABSAGEN</button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
