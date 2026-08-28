'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { notifyUser } from '@/lib/notify';
import type { ServiceType } from '@/lib/types';

export async function createRequest(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const gigId = String(formData.get('gig_id') ?? '').trim();
  const targetPhotographerId = String(formData.get('target_photographer_id') ?? '').trim();
  const location = String(formData.get('location') ?? '').trim();

  const { error } = await supabase.from('service_requests').insert({
    dj_user_id: user.id,
    gig_id: gigId || null,
    location,
    date: String(formData.get('date') ?? ''),
    service_type: String(formData.get('service_type') ?? 'photo') as ServiceType,
    notes: String(formData.get('notes') ?? '').trim() || null,
    target_photographer_id: targetPhotographerId || null,
  });
  if (error) console.error('[createRequest]', error);
  else if (targetPhotographerId) {
    await notifyUser(supabase, targetPhotographerId, `Neue Direktanfrage für ${location}`, '/marketplace');
  }

  revalidatePath('/marketplace');
  redirect('/marketplace');
}

export async function cancelRequest(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('service_requests').update({ status: 'cancelled' }).eq('id', id);
  if (error) console.error('[cancelRequest]', error);
  revalidatePath('/marketplace');
}

export async function createOffer(requestId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase.from('service_offers').insert({
    request_id: requestId,
    photographer_user_id: user.id,
    message: String(formData.get('message') ?? '').trim() || null,
  });
  if (error) console.error('[createOffer]', error);
  else {
    const { data: request } = await supabase.from('service_requests').select('dj_user_id, location').eq('id', requestId).single();
    if (request) await notifyUser(supabase, request.dj_user_id, `Neues Angebot für ${request.location}`, '/marketplace');
  }

  revalidatePath('/marketplace');
}

export async function acceptOffer(offerId: string) {
  const supabase = await createClient();
  const { data: offer } = await supabase.from('service_offers').select('photographer_user_id, request_id').eq('id', offerId).single();
  const { error } = await supabase.rpc('accept_service_offer', { offer_id: offerId });
  if (error) console.error('[acceptOffer]', error);
  else if (offer) {
    const { data: request } = await supabase.from('service_requests').select('location').eq('id', offer.request_id).single();
    await notifyUser(supabase, offer.photographer_user_id, `Dein Angebot für ${request?.location ?? 'einen Auftrag'} wurde angenommen`, '/bookings');
  }

  revalidatePath('/marketplace');
  revalidatePath('/bookings');
  revalidatePath('/');
}

export async function declineOffer(offerId: string) {
  const supabase = await createClient();
  const { data: offer } = await supabase.from('service_offers').select('photographer_user_id, request_id').eq('id', offerId).single();
  const { error } = await supabase.from('service_offers').update({ status: 'declined' }).eq('id', offerId);
  if (error) console.error('[declineOffer]', error);
  else if (offer) {
    const { data: request } = await supabase.from('service_requests').select('location').eq('id', offer.request_id).single();
    await notifyUser(supabase, offer.photographer_user_id, `Dein Angebot für ${request?.location ?? 'einen Auftrag'} wurde abgelehnt`, '/marketplace');
  }
  revalidatePath('/marketplace');
}

export async function createAvailability(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const date = String(formData.get('date') ?? '');
  const startTime = String(formData.get('start_time') ?? '').trim();
  const endTime = String(formData.get('end_time') ?? '').trim();
  const location = String(formData.get('location') ?? '').trim();
  if (!date || !startTime || !endTime || !location) return;

  const { error } = await supabase.from('photographer_availability').insert({
    photographer_user_id: user.id,
    date,
    start_time: startTime,
    end_time: endTime,
    location,
  });
  if (error) console.error('[createAvailability]', error);

  revalidatePath('/marketplace');
}

export async function deleteAvailability(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('photographer_availability').delete().eq('id', id);
  if (error) console.error('[deleteAvailability]', error);
  revalidatePath('/marketplace');
}
