'use client';

import { useState, type FormEvent } from 'react';
import { completeOnboarding } from './actions';
import type { Role } from '@/lib/types';

const ROLE_OPTIONS: { value: Role; label: string; note: string | null }[] = [
  { value: 'dj_producer', label: 'DJ / PRODUCER', note: null },
  { value: 'photographer_videographer', label: 'FOTOGRAF / VIDEOGRAF', note: null },
  { value: 'manager', label: 'MANAGER', note: 'BALD VERFÜGBAR' },
];

const ERROR_MESSAGE: Record<string, string> = {
  invalid_username: 'Benutzername: 3-20 Zeichen, nur Kleinbuchstaben, Zahlen, "_" oder ".".',
  username_taken: 'Dieser Benutzername ist schon vergeben.',
  save_failed: 'Speichern fehlgeschlagen — bitte nochmal versuchen.',
};

export function OnboardingForm({
  defaultRoles,
  defaultDisplayName,
  defaultStatus,
  defaultUsername,
}: {
  defaultRoles: Role[];
  defaultDisplayName: string;
  defaultStatus: string;
  defaultUsername: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    const result = await completeOnboarding(formData);
    if (result?.error) {
      setError(ERROR_MESSAGE[result.error] ?? 'Etwas ist schiefgelaufen.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {ROLE_OPTIONS.map((role) => (
        <label className="form-toggle" key={role.value}>
          <input type="checkbox" name="roles" value={role.value} className="visual-checkbox" defaultChecked={defaultRoles.includes(role.value)} />
          <span>{role.label}</span>
          {role.note && <span className="due">{role.note}</span>}
        </label>
      ))}

      <div className="form-field" style={{ marginTop: 12 }}>
        <span className="label">BENUTZERNAME</span>
        <input
          className="field"
          name="username"
          placeholder="z.B. dj_bastek"
          defaultValue={defaultUsername}
          pattern="[a-z0-9_.]{3,20}"
          title="3-20 Zeichen: Kleinbuchstaben, Zahlen, Unterstrich oder Punkt"
          required
        />
        <p className="muted" style={{ fontSize: 9, marginTop: 2 }}>Eindeutig, wie bei Instagram — kleingeschrieben, ohne Leerzeichen.</p>
      </div>

      <div className="form-field">
        <span className="label">NAME</span>
        <input className="field" name="display_name" placeholder="Wie sollen wir dich nennen?" defaultValue={defaultDisplayName} required />
      </div>

      <div className="form-field">
        <span className="label">STATUS</span>
        <input className="field" name="status" placeholder="z.B. Techno DJ aus Köln" defaultValue={defaultStatus} />
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="button solid-button" disabled={submitting}>{submitting ? '…' : 'WEITER'}</button>
    </form>
  );
}
