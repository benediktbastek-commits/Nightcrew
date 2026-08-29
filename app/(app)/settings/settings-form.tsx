'use client';

import { useRef, useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile, Role } from '@/lib/types';
import { updateProfile } from './actions';

const ROLE_OPTIONS: { value: Role; label: string; note: string | null }[] = [
  { value: 'dj_producer', label: 'DJ / PRODUCER', note: null },
  { value: 'photographer_videographer', label: 'FOTOGRAF / VIDEOGRAF', note: null },
  { value: 'manager', label: 'MANAGER', note: 'BALD VERFÜGBAR' },
];

const SOCIAL_FIELDS: { key: keyof NonNullable<Profile['socials']>; label: string; placeholder: string }[] = [
  { key: 'instagram', label: 'INSTAGRAM', placeholder: '@deinname oder Link' },
  { key: 'tiktok', label: 'TIKTOK', placeholder: '@deinname oder Link' },
  { key: 'youtube', label: 'YOUTUBE', placeholder: '@deinkanal oder Link' },
  { key: 'spotify', label: 'SPOTIFY', placeholder: 'Link zum Artist-/Profil' },
  { key: 'website', label: 'WEBSITE', placeholder: 'deine-seite.de' },
];

const ERROR_MESSAGE: Record<string, string> = {
  invalid_username: 'Benutzername: 3-20 Zeichen, nur Kleinbuchstaben, Zahlen, "_" oder ".".',
  username_taken: 'Dieser Benutzername ist schon vergeben.',
  save_failed: 'Speichern fehlgeschlagen — bitte nochmal versuchen.',
};

export function SettingsForm({ profile, userId }: { profile: Profile; userId: string }) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${userId}/avatar.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);
    } catch (error) {
      console.error('[avatar upload]', error);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (avatarUrl) formData.set('avatar_url', avatarUrl);
    setError(null);
    const result = await updateProfile(formData);
    if (result?.error) {
      setError(ERROR_MESSAGE[result.error] ?? 'Etwas ist schiefgelaufen.');
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="row" style={{ alignItems: 'center', gap: 14 }}>
        <button type="button" className="avatar" style={{ flex: 'none', width: 56, height: 56, fontSize: 16, backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }} onClick={() => fileInputRef.current?.click()}>
          {!avatarUrl && (profile.display_name?.slice(0, 2).toUpperCase() ?? '··')}
        </button>
        <div>
          <button type="button" className="edit-link" onClick={() => fileInputRef.current?.click()}>{uploading ? 'LÄDT HOCH …' : 'FOTO ÄNDERN'}</button>
          <p className="muted" style={{ fontSize: 9, marginTop: 4 }}>Am besten ein Foto, auf dem dein Gesicht mittig ist — wird als Kreis zugeschnitten.</p>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
      </div>

      <div className="form-field">
        <span className="label">BENUTZERNAME</span>
        <input className="field" name="username" defaultValue={profile.username ?? ''} placeholder="z.B. dj_bastek" pattern="[a-z0-9_.]{3,20}" required />
      </div>

      <div className="form-field">
        <span className="label">NAME</span>
        <input className="field" name="display_name" defaultValue={profile.display_name ?? ''} required />
      </div>

      <div className="form-field">
        <span className="label">STATUS</span>
        <input className="field" name="status" defaultValue={profile.status ?? ''} placeholder="z.B. Techno DJ aus Köln" />
      </div>

      <div className="form-field">
        <span className="label">STANDORT</span>
        <input className="field" name="city" defaultValue={profile.city ?? ''} placeholder="z.B. Köln" />
      </div>

      <div className="form-field">
        <span className="label">ÜBER MICH</span>
        <textarea className="field" name="bio" defaultValue={profile.bio ?? ''} placeholder="Kurze Beschreibung für dein Profil — sichtbar für andere im Marktplatz" />
      </div>

      <div className="form-field">
        <span className="label">SOCIALS</span>
        {SOCIAL_FIELDS.map((field) => (
          <input
            key={field.key}
            className="field"
            style={{ marginTop: 6 }}
            name={`social_${field.key}`}
            defaultValue={profile.socials?.[field.key] ?? ''}
            placeholder={`${field.label} · ${field.placeholder}`}
          />
        ))}
      </div>

      <div className="form-field">
        <span className="label">ROLLEN</span>
        {ROLE_OPTIONS.map((role) => (
          <label className="form-toggle" key={role.value}>
            <input type="checkbox" name="roles" value={role.value} className="visual-checkbox" defaultChecked={profile.roles?.includes(role.value)} />
            <span>{role.label}</span>
            {role.note && <span className="due">{role.note}</span>}
          </label>
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="button solid-button">{saved ? '✓ GESPEICHERT' : 'SPEICHERN'}</button>
    </form>
  );
}
