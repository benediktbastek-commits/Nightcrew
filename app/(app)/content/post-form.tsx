'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Screen } from '@/components/screen';
import { toDatetimeLocal } from '@/lib/format';
import type { Post, PostFormat, PostPlatform, PostStatus, Release } from '@/lib/types';

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

const STATUS_OPTIONS: { value: PostStatus; label: string }[] = [
  { value: 'idea', label: 'IDEE' },
  { value: 'draft', label: 'ENTWURF' },
  { value: 'in_progress', label: 'IN ARBEIT' },
  { value: 'ready', label: 'FERTIG' },
];

export function PostForm({
  mode,
  post,
  releases,
  action,
}: {
  mode: 'create' | 'edit';
  post?: Post;
  releases: Release[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [status, setStatus] = useState<PostStatus>(post?.status ?? 'idea');

  return (
    <Screen title={mode === 'create' ? 'NEUER POST' : 'POST BEARBEITEN'} back="/content">
      <form action={action} className="auth-form">
        <input type="hidden" name="status" value={status} />

        <div className="form-field">
          <span className="label">PLATTFORM</span>
          <select className="field" name="platform" defaultValue={post?.platform ?? 'instagram'}>
            {PLATFORM_OPTIONS.map((option) => (
              <option value={option.value} key={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <span className="label">FORMAT</span>
          <select className="field" name="format" defaultValue={post?.format ?? 'reel'}>
            {FORMAT_OPTIONS.map((option) => (
              <option value={option.value} key={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <span className="label">TEXT</span>
          <textarea className="field" name="caption" defaultValue={post?.caption ?? ''} />
        </div>

        <div className="form-field">
          <span className="label">GEPLANT FÜR</span>
          <input className="field" type="datetime-local" name="planned_at" defaultValue={toDatetimeLocal(post?.planned_at ?? null)} />
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
          <span className="label">RELEASE</span>
          <select className="field" name="release_id" defaultValue={post?.release_id ?? ''}>
            <option value="">— kein Release —</option>
            {releases.map((release) => (
              <option value={release.id} key={release.id}>{release.title}</option>
            ))}
          </select>
        </div>

        <div className="button-row">
          <button type="submit" className="button solid-button">SPEICHERN</button>
          <Link href="/content" className="button">ABBRECHEN</Link>
        </div>
      </form>
    </Screen>
  );
}
