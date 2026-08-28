'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Screen } from '@/components/screen';
import type { Release, ReleaseKind, ReleaseStatus } from '@/lib/types';

const KIND_OPTIONS: { value: ReleaseKind; label: string }[] = [
  { value: 'ep', label: 'EP' },
  { value: 'single', label: 'SINGLE' },
  { value: 'album', label: 'ALBUM' },
  { value: 'remix', label: 'REMIX' },
];

const STATUS_OPTIONS: { value: ReleaseStatus; label: string }[] = [
  { value: 'planning', label: 'IN PLANUNG' },
  { value: 'scheduled', label: 'GEPLANT' },
  { value: 'released', label: 'ERSCHIENEN' },
];

export function ReleaseForm({
  mode,
  release,
  action,
}: {
  mode: 'create' | 'edit';
  release?: Release;
  action: (formData: FormData) => Promise<void>;
}) {
  const [kind, setKind] = useState<ReleaseKind>(release?.kind ?? 'ep');
  const [status, setStatus] = useState<ReleaseStatus>(release?.status ?? 'planning');

  return (
    <Screen title={mode === 'create' ? 'NEUES RELEASE' : 'RELEASE BEARBEITEN'} back="/releases">
      <form action={action} className="auth-form">
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="status" value={status} />

        <div className="form-field">
          <span className="label">TITEL</span>
          <input className="field" name="title" defaultValue={release?.title} required />
        </div>

        <div className="form-field">
          <span className="label">ART</span>
          <div className="segmented">
            {KIND_OPTIONS.map((option) => (
              <button type="button" key={option.value} className={kind === option.value ? 'active' : ''} onClick={() => setKind(option.value)}>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-field">
          <span className="label">LABEL</span>
          <input className="field" name="label" defaultValue={release?.label ?? ''} />
        </div>

        <div className="form-row">
          <div className="form-field">
            <span className="label">KAMPAGNEN-START</span>
            <input className="field" type="date" name="campaign_start" defaultValue={release?.campaign_start} required />
          </div>
          <div className="form-field">
            <span className="label">VERÖFFENTLICHUNG</span>
            <input className="field" type="date" name="release_date" defaultValue={release?.release_date} required />
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

        <div className="form-row">
          <div className="form-field">
            <span className="label">PRE-SAVES</span>
            <input className="field" name="presave_count" inputMode="numeric" defaultValue={release?.presave_count ?? 0} />
          </div>
          <div className="form-field">
            <span className="label">PRE-SAVE ZIEL</span>
            <input className="field" name="presave_goal" inputMode="numeric" defaultValue={release?.presave_goal ?? 0} />
          </div>
        </div>

        <div className="form-field">
          <span className="label">BUDGET (€)</span>
          <input className="field" name="budget" inputMode="decimal" defaultValue={release ? String(release.budget_cents / 100) : ''} />
        </div>

        <div className="button-row">
          <button type="submit" className="button solid-button">SPEICHERN</button>
          <Link href="/releases" className="button">ABBRECHEN</Link>
        </div>
      </form>
    </Screen>
  );
}
