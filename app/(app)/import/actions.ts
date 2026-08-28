'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { windowBucket } from '@/lib/format';
import type { AccountMetric, PostPlatform } from '@/lib/types';

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
  const existingId = ((sameplatform ?? []) as AccountMetric[]).find((row) => windowBucket(row.period_start, row.period_end) === newBucket)?.id;

  const { error } = existingId
    ? await supabase.from('account_metrics').update(payload).eq('id', existingId)
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
