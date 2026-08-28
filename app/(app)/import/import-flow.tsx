'use client';

import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Chip, Segmented } from '@/components/ui';
import { formatDayMonth } from '@/lib/format';
import type { AccountExtraction, Post, PostExtraction, PostFormat, PostPlatform } from '@/lib/types';
import { confirmAccountImport, confirmPostImport } from './actions';

const MODES = ['ACCOUNT', 'EINZELNER POST'] as const;
const PLATFORM_OPTIONS: { value: PostPlatform; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'spotify', label: 'Spotify' },
];

const FORMAT_OPTIONS: { value: PostFormat; label: string }[] = [
  { value: 'reel', label: 'Reel' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'story', label: 'Story' },
  { value: 'video', label: 'Video' },
];

const FIELD_LABELS: { key: keyof AccountExtraction; label: string }[] = [
  { key: 'views', label: 'AUFRUFE' },
  { key: 'reach', label: 'BETRACHTER' },
  { key: 'profile_views', label: 'PROFILAUFRUFE' },
  { key: 'followers_delta', label: 'NEUE FOLLOWER' },
  { key: 'likes', label: 'LIKES' },
  { key: 'comments', label: 'KOMMENTARE' },
  { key: 'reposts', label: 'REPOSTS' },
  { key: 'shares', label: 'GETEILTE INHALTE' },
  { key: 'saves', label: 'GESPEICHERTE INHALTE' },
  { key: 'interactions', label: 'INTERAKTIONEN (GESAMT)' },
];

const POST_FIELD_LABELS: { key: keyof PostExtraction; label: string }[] = [
  { key: 'views', label: 'AUFRUFE' },
  { key: 'likes', label: 'LIKES' },
  { key: 'saves', label: 'GESPEICHERT' },
  { key: 'shares', label: 'GETEILT' },
  { key: 'followers_delta', label: 'NEUE FOLLOWER' },
  { key: 'avg_watch_seconds', label: 'Ø WIEDERGABE (SEK.)' },
  { key: 'completion_rate', label: 'COMPLETION RATE (%)' },
];

type Step = 'pick' | 'reading' | 'review' | 'error' | 'done';

async function resizeImage(file: File): Promise<{ base64: string; mediaType: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image_load_failed'));
    img.src = dataUrl;
  });

  const maxEdge = 2048;
  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_unsupported');
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return { base64: jpegDataUrl.split(',')[1] ?? '', mediaType: 'image/jpeg' };
}

export function ImportFlow({ posts }: { posts: Post[] }) {
  const [mode, setMode] = useState<(typeof MODES)[number]>('ACCOUNT');
  const [step, setStep] = useState<Step>('pick');
  const [extraction, setExtraction] = useState<AccountExtraction | PostExtraction | null>(null);
  const [importId, setImportId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const kind = mode === 'ACCOUNT' ? 'account' : 'post';

  async function handleFile(file: File) {
    setStep('reading');
    try {
      const { base64, mediaType } = await resizeImage(file);
      const response = await fetch('/api/imports/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType, kind }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.error === 'missing_api_key') {
          setErrorMessage('Kein Anthropic API-Key hinterlegt. Bitte in .env.local eintragen (ANTHROPIC_API_KEY).');
        } else {
          setErrorMessage('Der Screenshot konnte nicht gelesen werden.');
        }
        setStep('error');
        return;
      }
      setExtraction(data.extraction);
      setImportId(data.importId);
      setStep('review');
    } catch {
      setErrorMessage('Der Screenshot konnte nicht verarbeitet werden.');
      setStep('error');
    }
  }

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!importId) return;
    const formData = new FormData(event.currentTarget);
    const result = mode === 'ACCOUNT' ? await confirmAccountImport(importId, formData) : await confirmPostImport(importId, formData);
    if (result.error) {
      setErrorMessage('Speichern fehlgeschlagen.');
      setStep('error');
      return;
    }
    setStep('done');
  }

  function reset() {
    setStep('pick');
    setExtraction(null);
    setImportId(null);
    setErrorMessage('');
  }

  return (
    <>
      <Segmented labels={[...MODES]} value={mode} onChange={(label) => { setMode(label as (typeof MODES)[number]); reset(); }} />

      {step === 'pick' && (
        <>
          <button type="button" className="dropzone" onClick={() => fileInputRef.current?.click()}>
            <span className="dropzone-icon">＋</span>
            <span>SCREENSHOT ABLEGEN</span>
            <span className="muted">oder aus der Galerie wählen</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
              event.target.value = '';
            }}
          />
          <p className="muted">
            {mode === 'ACCOUNT'
              ? 'Lade einen Screenshot deiner Account-Übersicht hoch (z.B. Spotify for Artists, Instagram Insights).'
              : 'Lade einen Screenshot der Kennzahlen zu einem einzelnen Post hoch (z.B. Instagram-Insights zu einem Reel) — Claude liest die Zahlen aus und schätzt kurz ein, was gut oder schlecht gelaufen ist.'}
          </p>
        </>
      )}

      {step === 'reading' && (
        <div className="dropzone">
          <span className="pulse" />
          <span>CLAUDE LIEST DEN SCREENSHOT</span>
        </div>
      )}

      {step === 'error' && (
        <>
          <p className="empty-state">{errorMessage}</p>
          <button type="button" className="button" onClick={reset}>NOCHMAL VERSUCHEN</button>
        </>
      )}

      {step === 'review' && extraction && mode === 'ACCOUNT' && (
        <form onSubmit={handleConfirm} className="auth-form">
          <div className="row">
            <span className="label bright">ERKANNT</span>
            <Chip tone="outline">{Object.values(extraction.confidence ?? {}).filter((v) => v >= 0.9).length} / {Object.keys(extraction.confidence ?? {}).length} SICHER</Chip>
          </div>

          <div className="form-field">
            <span className="label">PLATTFORM</span>
            <select className="field" name="platform" defaultValue={extraction.platform}>
              {PLATFORM_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-field">
              <span className="label">ZEITRAUM VON</span>
              <input className="field" type="date" name="period_start" defaultValue={(extraction as AccountExtraction).period_start ?? ''} required />
            </div>
            <div className="form-field">
              <span className="label">ZEITRAUM BIS</span>
              <input className="field" type="date" name="period_end" defaultValue={(extraction as AccountExtraction).period_end ?? ''} required />
            </div>
          </div>

          {FIELD_LABELS.map(({ key, label }) => {
            const confidence = extraction.confidence?.[key] ?? 0;
            const sure = confidence >= 0.9;
            return (
              <div className="form-field" key={key}>
                <div className="row">
                  <span className="label">{label}</span>
                  <Chip tone={sure ? 'dim' : 'outline'}>{sure ? 'SICHER' : 'PRÜFEN'}</Chip>
                </div>
                <input className="field" name={key} inputMode="numeric" defaultValue={(extraction as AccountExtraction)[key] as number | undefined ?? ''} />
              </div>
            );
          })}

          <div className="button-row">
            <button type="submit" className="button solid-button">ÜBERNEHMEN</button>
            <button type="button" className="button" onClick={reset}>VERWERFEN</button>
          </div>
        </form>
      )}

      {step === 'review' && extraction && mode === 'EINZELNER POST' && (
        <form onSubmit={handleConfirm} className="auth-form">
          <div className="panel">
            <span className="label bright">KI-EINSCHÄTZUNG</span>
            <p style={{ marginTop: 8, marginBottom: 0 }}>{(extraction as PostExtraction).analysis}</p>
          </div>

          <div className="form-field">
            <span className="label">PLATTFORM</span>
            <select className="field" name="platform" defaultValue={extraction.platform}>
              {PLATFORM_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <span className="label">DATUM</span>
            <input className="field" type="date" name="posted_date" defaultValue={(extraction as PostExtraction).posted_date ?? ''} />
          </div>

          <div className="form-field">
            <span className="label">VERKNÜPFEN MIT POST</span>
            <select className="field" name="post_id" defaultValue="">
              <option value="">— neuen Post anlegen —</option>
              {posts.map((post) => (
                <option value={post.id} key={post.id}>
                  {(post.caption ? post.caption.slice(0, 32) : PLATFORM_OPTIONS.find((p) => p.value === post.platform)?.label) ?? post.platform}
                  {post.planned_at ? ` · ${formatDayMonth(post.planned_at.slice(0, 10))}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <span className="label">TYP (FALLS NEUER POST)</span>
            <select className="field" name="format" defaultValue="reel">
              {FORMAT_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {POST_FIELD_LABELS.map(({ key, label }) => {
            const confidence = extraction.confidence?.[key] ?? 0;
            const sure = confidence >= 0.9;
            return (
              <div className="form-field" key={key}>
                <div className="row">
                  <span className="label">{label}</span>
                  <Chip tone={sure ? 'dim' : 'outline'}>{sure ? 'SICHER' : 'PRÜFEN'}</Chip>
                </div>
                <input className="field" name={key} inputMode="decimal" defaultValue={(extraction as PostExtraction)[key] as number | undefined ?? ''} />
              </div>
            );
          })}

          <div className="button-row">
            <button type="submit" className="button solid-button">ÜBERNEHMEN</button>
            <button type="button" className="button" onClick={reset}>VERWERFEN</button>
          </div>
        </form>
      )}

      {step === 'done' && (
        <>
          <div className="panel">
            {mode === 'EINZELNER POST' && extraction ? (
              <>
                <span className="label bright">EINSCHÄTZUNG</span>
                <p style={{ marginTop: 8, marginBottom: 0 }}>{(extraction as PostExtraction).analysis}</p>
              </>
            ) : (
              <p>Die Kennzahlen wurden gespeichert.</p>
            )}
          </div>
          <div className="button-row">
            <Link href="/" className="button solid-button">ZUR ÜBERSICHT</Link>
            <button type="button" className="button" onClick={reset}>NÄCHSTER</button>
          </div>
        </>
      )}
    </>
  );
}
