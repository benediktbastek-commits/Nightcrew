'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Screen } from '@/components/screen';
import type { Invoice, InvoiceStatus } from '@/lib/types';

const STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: 'draft', label: 'ENTWURF' },
  { value: 'open', label: 'OFFEN' },
  { value: 'paid', label: 'BEZAHLT' },
  { value: 'overdue', label: 'MAHNUNG' },
];

export function InvoiceForm({
  mode,
  invoice,
  action,
}: {
  mode: 'create' | 'edit';
  invoice?: Invoice;
  action: (formData: FormData) => Promise<void>;
}) {
  const [status, setStatus] = useState<InvoiceStatus>(invoice?.status ?? 'draft');

  return (
    <Screen title={mode === 'create' ? 'NEUE RECHNUNG' : 'RECHNUNG BEARBEITEN'} back="/finance">
      <form action={action} className="auth-form">
        <input type="hidden" name="status" value={status} />

        <div className="form-row">
          <div className="form-field">
            <span className="label">NUMMER</span>
            <input className="field" name="number" defaultValue={invoice?.number} required />
          </div>
          <div className="form-field">
            <span className="label">BETRAG (€)</span>
            <input className="field" name="amount" inputMode="decimal" defaultValue={invoice ? String(invoice.amount_cents / 100) : ''} required />
          </div>
        </div>

        <div className="form-field">
          <span className="label">EMPFÄNGER</span>
          <input className="field" name="recipient" defaultValue={invoice?.recipient} required />
        </div>

        <div className="form-row">
          <div className="form-field">
            <span className="label">RECHNUNGSDATUM</span>
            <input className="field" type="date" name="issued_on" defaultValue={invoice?.issued_on} required />
          </div>
          <div className="form-field">
            <span className="label">FÄLLIG AM</span>
            <input className="field" type="date" name="due_on" defaultValue={invoice?.due_on ?? ''} />
          </div>
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

        <div className="button-row">
          <button type="submit" className="button solid-button">SPEICHERN</button>
          <Link href="/finance" className="button">ABBRECHEN</Link>
        </div>
      </form>
    </Screen>
  );
}
