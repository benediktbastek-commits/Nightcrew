'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Contact, ContactRole } from '@/lib/types';

const ROLE_OPTIONS: { value: ContactRole; label: string }[] = [
  { value: 'booking', label: 'BOOKING' },
  { value: 'label_promo', label: 'LABEL / PROMO' },
  { value: 'crew', label: 'CREW' },
];

export function ContactForm({
  mode,
  contact,
  action,
}: {
  mode: 'create' | 'edit';
  contact?: Contact;
  action: (formData: FormData) => Promise<void>;
}) {
  const [role, setRole] = useState<ContactRole>(contact?.role ?? 'booking');

  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="role" value={role} />

      <div className="form-field">
        <span className="label">NAME</span>
        <input className="field" name="name" defaultValue={contact?.name} required />
      </div>

      <div className="form-field">
        <span className="label">ORGANISATION</span>
        <input className="field" name="organisation" defaultValue={contact?.organisation ?? ''} placeholder="z.B. Club, Label, Agentur" />
      </div>

      <div className="form-field">
        <span className="label">ROLLE</span>
        <div className="segmented">
          {ROLE_OPTIONS.map((option) => (
            <button type="button" key={option.value} className={role === option.value ? 'active' : ''} onClick={() => setRole(option.value)}>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <span className="label">E-MAIL</span>
          <input className="field" type="email" name="email" defaultValue={contact?.email ?? ''} />
        </div>
        <div className="form-field">
          <span className="label">TELEFON</span>
          <input className="field" type="tel" name="phone" defaultValue={contact?.phone ?? ''} />
        </div>
      </div>

      <div className="form-field">
        <span className="label">LETZTER KONTAKT</span>
        <input className="field" type="date" name="last_contact_at" defaultValue={contact?.last_contact_at ?? ''} />
      </div>

      <div className="form-field">
        <span className="label">NOTIZEN</span>
        <textarea className="field" name="notes" defaultValue={contact?.notes ?? ''} placeholder="z.B. Vorlieben, Vereinbarungen, Kontext" />
      </div>

      <div className="button-row">
        <button type="submit" className="button solid-button">SPEICHERN</button>
        <Link href="/contacts" className="button">ABBRECHEN</Link>
      </div>
    </form>
  );
}
