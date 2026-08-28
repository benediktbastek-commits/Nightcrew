'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function createItineraryStop(gigId: string, formData: FormData) {
  const time = String(formData.get('time') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  if (!time || !title) return;

  const supabase = await createClient();
  const { count } = await supabase.from('itinerary_stops').select('*', { count: 'exact', head: true }).eq('gig_id', gigId);
  const { error } = await supabase.from('itinerary_stops').insert({
    gig_id: gigId,
    time,
    title,
    detail: String(formData.get('detail') ?? '').trim() || null,
    sort_order: count ?? 0,
  });
  if (error) console.error('[createItineraryStop]', error);
  revalidatePath('/tour');
}

export async function toggleItineraryStop(id: string, done: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from('itinerary_stops').update({ done: !done }).eq('id', id);
  if (error) console.error('[toggleItineraryStop]', error);
  revalidatePath('/tour');
}

export async function createRiderItem(gigId: string, formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  if (!title) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('tasks').insert({ title, user_id: user.id, scope: 'gig', gig_id: gigId });
  if (error) console.error('[createRiderItem]', error);
  revalidatePath('/tour');
}

export async function toggleRiderItem(id: string, done: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from('tasks').update({ done: !done }).eq('id', id);
  if (error) console.error('[toggleRiderItem]', error);
  revalidatePath('/tour');
}
