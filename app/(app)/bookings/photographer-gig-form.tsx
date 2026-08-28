'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Gig, GigStatus } from '@/lib/types';

const STATUS_OPTIONS: { value: GigStatus; label: string }[] = [
  { value: 'requested', label: 'ANGEFRAGT' },
  { value: 'option', label: 'OPTION' },
  { value: 'confirmed', label: 'BESTÄTIGT' },
];

export function PhotographerGigForm({
  gig,
  action,
}: {
  mode: 'create' | 'edit';
  gig?: Gig;
  action: (formData: FormData) => Promise<void>;
}) {
  const [status, setStatus] = useState<GigStatus>(gig?.status ?? 'requested');

  return (
    <>
      <form action={action} className="auth-form">
        <input type="hidden" name="status" value={status} />

        <div className="form-field">
          <span className="label">VENUE / KUNDE</span>
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
          <span className="label">NOTIZEN</span>
          <textarea className="field" name="tech_notes" defaultValue={gig?.tech_notes ?? ''} />
        </div>

        <div className="button-row">
          <button type="submit" className="button solid-button">SPEICHERN</button>
          <Link href="/bookings" className="button">ABBRECHEN</Link>
        </div>
      </form>
    </>
  );
}
