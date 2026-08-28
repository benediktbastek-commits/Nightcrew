'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Contact, Gig, GigStatus } from '@/lib/types';

const STATUS_OPTIONS: { value: GigStatus; label: string }[] = [
  { value: 'requested', label: 'ANGEFRAGT' },
  { value: 'option', label: 'OPTION' },
  { value: 'confirmed', label: 'BESTÄTIGT' },
];

export function GigForm({
  mode,
  gig,
  contacts,
  action,
}: {
  mode: 'create' | 'edit';
  gig?: Gig;
  contacts: Contact[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [status, setStatus] = useState<GigStatus>(gig?.status ?? 'requested');

  return (
    <>
      <form action={action} className="auth-form">
        <input type="hidden" name="status" value={status} />

        <div className="form-field">
          <span className="label">VENUE</span>
          <input className="field" name="venue" defaultValue={gig?.venue} required />
        </div>

        <div className="form-row">
          <div className="form-field">
            <span className="label">STADT</span>
            <input className="field" name="city" defaultValue={gig?.city} required />
          </div>
          <div className="form-field">
            <span className="label">DATUM</span>
            <input className="field" type="date" name="date" defaultValue={gig?.date} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <span className="label">SET-START</span>
            <input className="field" type="time" name="set_start" defaultValue={gig?.set_start ?? ''} />
          </div>
          <div className="form-field">
            <span className="label">SET-ENDE</span>
            <input className="field" type="time" name="set_end" defaultValue={gig?.set_end ?? ''} />
          </div>
        </div>

        <div className="form-field">
          <span className="label">GAGE (€)</span>
          <input className="field" name="fee" inputMode="decimal" defaultValue={gig ? String(gig.fee_cents / 100) : ''} />
        </div>

        <div className="form-field">
          <span className="label">STATUS</span>
          <div className="segmented">
            {STATUS_OPTIONS.map((option) => (
              <button type="button" key={option.value} className={status === option.value ? 'active' : ''} onClick={() => setStatus(option.value)}>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-field">
          <span className="label">KONTAKT</span>
          <select className="field" name="contact_id" defaultValue={gig?.contact_id ?? ''}>
            <option value="">— kein Kontakt —</option>
            {contacts.map((contact) => (
              <option value={contact.id} key={contact.id}>{contact.name}</option>
            ))}
          </select>
          <Link href="/contacts/new" className="edit-link" style={{ marginTop: 6 }}>+ NEUEN KONTAKT ANLEGEN</Link>
        </div>

        <div className="form-field">
          <span className="label">TECHNIK</span>
          <textarea className="field" name="tech_notes" defaultValue={gig?.tech_notes ?? ''} />
        </div>

        <div className="form-field">
          <span className="label">HOTEL</span>
          <input className="field" name="hotel" defaultValue={gig?.hotel ?? ''} />
        </div>

        <div className="form-field">
          <span className="label">ANREISE</span>
          <input className="field" name="travel" defaultValue={gig?.travel ?? ''} />
        </div>

        <label className="form-toggle">
          <input type="checkbox" name="advance_confirmed" defaultChecked={gig?.advance_confirmed} className="visual-checkbox" />
          <span>Advance bestätigt</span>
        </label>
        <label className="form-toggle">
          <input type="checkbox" name="rider_sent" defaultChecked={gig?.rider_sent} className="visual-checkbox" />
          <span>Rider gesendet</span>
        </label>

        <div className="button-row">
          <button type="submit" className="button solid-button">SPEICHERN</button>
          <Link href="/bookings" className="button">ABBRECHEN</Link>
        </div>
      </form>
    </>
  );
}
