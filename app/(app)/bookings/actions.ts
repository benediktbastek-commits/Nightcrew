'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { euroToCents } from '@/lib/format';
import type { GigStatus } from '@/lib/types';

function readGigFields(formData: FormData) {
  const contactId = String(formData.get('contact_id') ?? '');
  return {
    venue: String(formData.get('venue') ?? '').trim(),
    city: String(formData.get('city') ?? '').trim(),
    date: String(formData.get('date') ?? ''),
    set_start: String(formData.get('set_start') ?? '') || null,
    set_end: String(formData.get('set_end') ?? '') || null,
    fee_cents: euroToCents(String(formData.get('fee') ?? '0')),
    status: String(formData.get('status') ?? 'requested') as GigStatus,
    contact_id: contactId || null,
    tech_notes: String(formData.get('tech_notes') ?? '') || null,
    hotel: String(formData.get('hotel') ?? '') || null,
    travel: String(formData.get('travel') ?? '') || null,
    advance_confirmed: formData.get('advance_confirmed') === 'on',
    rider_sent: formData.get('rider_sent') === 'on',
  };
}

export async function createGig(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase.from('gigs').insert({ ...readGigFields(formData), user_id: user.id });
  if (error) console.error('[createGig]', error);

  revalidatePath('/bookings');
  redirect('/bookings');
}

export async function updateGig(id: string, formData: FormData) {
  const supabase = await createClient();
  await supabase.from('gigs').update(readGigFields(formData)).eq('id', id);

  revalidatePath('/bookings');
  redirect('/bookings');
}

export async function confirmAdvance(id: string) {
  const supabase = await createClient();
  await supabase.from('gigs').update({ advance_confirmed: true }).eq('id', id);
  revalidatePath('/bookings');
}

export async function cancelGig(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('gigs').update({ status: 'cancelled' }).eq('id', id);
  if (error) console.error('[cancelGig]', error);

  revalidatePath('/bookings');
  revalidatePath('/');
}
