'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { windowBucket } from '@/lib/format';
import type { AccountMetric, PostFormat, PostPlatform } from '@/lib/types';

export async function confirmAccountImport(importId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthorized' };

  const periodStart = String(formData.get('period_start') ?? '');
  const periodEnd = String(formData.get('period_end') ?? '');
  if (!periodStart || !periodEnd) return { error: 'missing_period' };

  const numberOrNull = (key: string) => {
    const raw = String(formData.get(key) ?? '').trim();
    if (!raw) return null;
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) ? value : null;
  };

  const platform = String(formData.get('platform') ?? 'instagram') as PostPlatform;
  const payload = {
    platform,
    period_start: periodStart,
    period_end: periodEnd,
    views: numberOrNull('views'),
    reach: numberOrNull('reach'),
    profile_views: numberOrNull('profile_views'),
    followers_delta: numberOrNull('followers_delta'),
    interactions: numberOrNull('interactions'),
    likes: numberOrNull('likes'),
    comments: numberOrNull('comments'),
    reposts: numberOrNull('reposts'),
    shares: numberOrNull('shares'),
    saves: numberOrNull('saves'),
    source: 'screenshot' as const,
    import_id: importId,
  };

  // Zwei Screenshots derselben Plattform UND derselben Fenstergröße (z.B. beide "30 Tage")
  // sind derselbe Wert neu gemessen -> aktualisieren. Unterschiedliche Fenstergrößen
  // (30 Tage vs. 90 Tage) sind eigenständige Ansichten und bleiben nebeneinander bestehen.
  const newBucket = windowBucket(periodStart, periodEnd);
  const { data: sameplatform } = await supabase
    .from('account_metrics')
    .select('*')
    .eq('user_id', user.id)
    .eq('platform', platform);
  const existingRow = ((sameplatform ?? []) as AccountMetric[]).find((row) => windowBucket(row.period_start, row.period_end) === newBucket);

  // Bevor der bestehende Wert überschrieben wird, als "previous" sichern —
  // das ist die Basis für den Monatsvergleich (Trend) im Analytics-Tab.
  const previous = existingRow
    ? {
        views: existingRow.views,
        reach: existingRow.reach,
        profile_views: existingRow.profile_views,
        followers_delta: existingRow.followers_delta,
        interactions: existingRow.interactions,
        likes: existingRow.likes,
        comments: existingRow.comments,
        reposts: existingRow.reposts,
        shares: existingRow.shares,
        saves: existingRow.saves,
      }
    : null;

  const { error } = existingRow
    ? await supabase.from('account_metrics').update({ ...payload, previous }).eq('id', existingRow.id)
    : await supabase.from('account_metrics').insert({ ...payload, user_id: user.id });
  if (error) {
    console.error('[confirmAccountImport]', error);
    return { error: 'save_failed' };
  }

  const { error: importUpdateError } = await supabase.from('imports').update({ confirmed_at: new Date().toISOString() }).eq('id', importId);
  if (importUpdateError) console.error('[confirmAccountImport] imports update', importUpdateError);

  revalidatePath('/import');
  revalidatePath('/analytics');
  return { error: null };
}

export async function confirmPostImport(importId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthorized' };

  const numberOrNull = (key: string) => {
    const raw = String(formData.get(key) ?? '').trim();
    if (!raw) return null;
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) ? value : null;
  };

  let postId = String(formData.get('post_id') ?? '').trim();
  if (!postId) {
    // Kein bestehender Post ausgewählt — leichten Post-Eintrag anlegen, damit die
    // Kennzahlen trotzdem gespeichert werden können (post_metrics.post_id ist Pflicht).
    const platform = String(formData.get('platform') ?? 'instagram') as PostPlatform;
    const format = String(formData.get('format') ?? 'reel') as PostFormat;
    const postedDate = String(formData.get('posted_date') ?? '').trim();
    const { data: newPost, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        platform,
        format,
        status: 'published',
        planned_at: postedDate ? `${postedDate}T00:00:00` : new Date().toISOString(),
        published_at: postedDate ? `${postedDate}T00:00:00` : new Date().toISOString(),
      })
      .select('id')
      .single();
    if (postError || !newPost) {
      console.error('[confirmPostImport] create post', postError);
      return { error: 'save_failed' };
    }
    postId = newPost.id;
  }

  const { error } = await supabase.from('post_metrics').insert({
    post_id: postId,
    views: numberOrNull('views'),
    likes: numberOrNull('likes'),
    saves: numberOrNull('saves'),
    shares: numberOrNull('shares'),
    followers_delta: numberOrNull('followers_delta'),
    avg_watch_seconds: numberOrNull('avg_watch_seconds'),
    completion_rate: numberOrNull('completion_rate'),
    source: 'screenshot',
    import_id: importId,
  });
  if (error) {
    console.error('[confirmPostImport]', error);
    return { error: 'save_failed' };
  }

  const { error: importUpdateError } = await supabase.from('imports').update({ confirmed_at: new Date().toISOString() }).eq('id', importId);
  if (importUpdateError) console.error('[confirmPostImport] imports update', importUpdateError);

  revalidatePath('/import');
  revalidatePath('/content');
  return { error: null };
}
