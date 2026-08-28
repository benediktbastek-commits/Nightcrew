'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { euroToCents } from '@/lib/format';
import type { ReleaseKind, ReleaseStatus, TrackStatus } from '@/lib/types';

function readReleaseFields(formData: FormData) {
  return {
    title: String(formData.get('title') ?? '').trim(),
    kind: String(formData.get('kind') ?? 'ep') as ReleaseKind,
    label: String(formData.get('label') ?? '').trim() || null,
    release_date: String(formData.get('release_date') ?? ''),
    campaign_start: String(formData.get('campaign_start') ?? ''),
    status: String(formData.get('status') ?? 'planning') as ReleaseStatus,
    budget_cents: euroToCents(String(formData.get('budget') ?? '0')),
    presave_goal: Number.parseInt(String(formData.get('presave_goal') ?? '0'), 10) || 0,
    presave_count: Number.parseInt(String(formData.get('presave_count') ?? '0'), 10) || 0,
  };
}

export async function createRelease(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data, error } = await supabase.from('releases').insert({ ...readReleaseFields(formData), user_id: user.id }).select('id').single();
  if (error) console.error('[createRelease]', error);

  revalidatePath('/releases');
  redirect(data ? `/releases/${data.id}` : '/releases');
}

export async function updateRelease(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from('releases').update(readReleaseFields(formData)).eq('id', id);
  if (error) console.error('[updateRelease]', error);

  revalidatePath('/releases');
  redirect(`/releases/${id}`);
}

export async function createPhase(releaseId: string, formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const startsOn = String(formData.get('starts_on') ?? '');
  const endsOn = String(formData.get('ends_on') ?? '');
  if (!name || !startsOn || !endsOn) return;

  const supabase = await createClient();
  const { count } = await supabase.from('release_phases').select('*', { count: 'exact', head: true }).eq('release_id', releaseId);
  const { error } = await supabase.from('release_phases').insert({
    release_id: releaseId,
    no: (count ?? 0) + 1,
    name,
    starts_on: startsOn,
    ends_on: endsOn,
    sort_order: count ?? 0,
  });
  if (error) console.error('[createPhase]', error);
  revalidatePath(`/releases/${releaseId}`);
}

export async function createTrack(releaseId: string, formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  if (!title) return;

  const supabase = await createClient();
  const { count } = await supabase.from('tracks').select('*', { count: 'exact', head: true }).eq('release_id', releaseId);
  const { error } = await supabase.from('tracks').insert({
    release_id: releaseId,
    side_label: String(formData.get('side_label') ?? '').trim() || 'A1',
    title,
    status: String(formData.get('status') ?? 'open') as TrackStatus,
    sort_order: count ?? 0,
  });
  if (error) console.error('[createTrack]', error);
  revalidatePath(`/releases/${releaseId}`);
}

const NEXT_TRACK_STATUS: Record<TrackStatus, TrackStatus> = { open: 'revision', revision: 'master', master: 'open' };

export async function cycleTrackStatus(id: string, releaseId: string, status: TrackStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from('tracks').update({ status: NEXT_TRACK_STATUS[status] }).eq('id', id);
  if (error) console.error('[cycleTrackStatus]', error);
  revalidatePath(`/releases/${releaseId}`);
}

export async function createAsset(releaseId: string, formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;

  const supabase = await createClient();
  const { error } = await supabase.from('release_assets').insert({ release_id: releaseId, name });
  if (error) console.error('[createAsset]', error);
  revalidatePath(`/releases/${releaseId}`);
}

export async function toggleAsset(id: string, releaseId: string, done: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from('release_assets').update({ done: !done, done_on: !done ? new Date().toISOString().slice(0, 10) : null }).eq('id', id);
  if (error) console.error('[toggleAsset]', error);
  revalidatePath(`/releases/${releaseId}`);
}

export async function createDeadline(releaseId: string, formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  const dueDate = String(formData.get('due_date') ?? '');
  if (!title || !dueDate) return;

  const supabase = await createClient();
  const { error } = await supabase.from('release_deadlines').insert({ release_id: releaseId, title, due_date: dueDate });
  if (error) console.error('[createDeadline]', error);
  revalidatePath(`/releases/${releaseId}`);
}

export async function toggleDeadline(id: string, releaseId: string, done: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from('release_deadlines').update({ done: !done }).eq('id', id);
  if (error) console.error('[toggleDeadline]', error);
  revalidatePath(`/releases/${releaseId}`);
}

export async function createPhaseTask(releaseId: string, phaseId: string, formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  if (!title) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('tasks').insert({ title, user_id: user.id, scope: 'release', release_id: releaseId, phase_id: phaseId });
  if (error) console.error('[createPhaseTask]', error);
  revalidatePath(`/releases/${releaseId}`);
}

export async function togglePhaseTask(id: string, releaseId: string, done: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from('tasks').update({ done: !done }).eq('id', id);
  if (error) console.error('[togglePhaseTask]', error);
  revalidatePath(`/releases/${releaseId}`);
}
