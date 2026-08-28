'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { notifyUser } from '@/lib/notify';

export async function sendMessage(requestId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const content = String(formData.get('content') ?? '').trim();
  if (!content) return;

  const { error } = await supabase.from('messages').insert({ request_id: requestId, sender_id: user.id, content });
  if (error) {
    console.error('[sendMessage]', error);
    return;
  }

  const { data: request } = await supabase.from('service_requests').select('dj_user_id, matched_photographer_id, location').eq('id', requestId).single();
  if (request) {
    const otherUserId = request.dj_user_id === user.id ? request.matched_photographer_id : request.dj_user_id;
    if (otherUserId) await notifyUser(supabase, otherUserId, `Neue Nachricht zu ${request.location}`, `/marketplace/chat/${requestId}`);
  }

  revalidatePath(`/marketplace/chat/${requestId}`);
}
