'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { notifyUser } from '@/lib/notify';

export async function sendConnectionRequest(recipientId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthorized' };

  // Es darf immer nur eine Verbindung pro Personenpaar geben (DB-Constraint) — bei einer
  // vorher abgelehnten Anfrage wird die bestehende Zeile reaktiviert statt neu einzufügen.
  const { data: existing } = await supabase
    .from('connections')
    .select('id, status')
    .or(`and(requester_id.eq.${user.id},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${user.id})`)
    .maybeSingle();

  if (existing && existing.status !== 'declined') return { error: null };

  const { error } = existing
    ? await supabase.from('connections').update({ requester_id: user.id, recipient_id: recipientId, status: 'pending', responded_at: null }).eq('id', existing.id)
    : await supabase.from('connections').insert({ requester_id: user.id, recipient_id: recipientId });
  if (error) {
    console.error('[sendConnectionRequest]', error);
    return { error: 'send_failed' };
  }

  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle();
  await notifyUser(supabase, recipientId, `${profile?.display_name ?? 'Jemand'} möchte sich mit dir verbinden.`, '/network');

  revalidatePath('/network');
  revalidatePath(`/profile/${recipientId}`);
  return { error: null };
}

export async function acceptConnection(connectionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: connection } = await supabase.from('connections').select('requester_id').eq('id', connectionId).maybeSingle();
  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle();

  const { error } = await supabase.from('connections').update({ status: 'accepted', responded_at: new Date().toISOString() }).eq('id', connectionId);
  if (error) console.error('[acceptConnection]', error);

  if (connection?.requester_id) {
    await notifyUser(supabase, connection.requester_id, `${profile?.display_name ?? 'Jemand'} hat deine Verbindungsanfrage angenommen.`, '/network');
  }

  revalidatePath('/network');
}

export async function declineConnection(connectionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('connections').update({ status: 'declined', responded_at: new Date().toISOString() }).eq('id', connectionId);
  if (error) console.error('[declineConnection]', error);

  revalidatePath('/network');
}

export async function removeConnection(connectionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('connections').delete().eq('id', connectionId);
  if (error) console.error('[removeConnection]', error);

  revalidatePath('/network');
}

export async function sendDirectMessage(connectionId: string, formData: FormData) {
  const content = String(formData.get('content') ?? '').trim();
  if (!content) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: connection } = await supabase.from('connections').select('requester_id, recipient_id').eq('id', connectionId).maybeSingle();
  if (!connection) return;

  const { error } = await supabase.from('direct_messages').insert({ connection_id: connectionId, sender_id: user.id, content });
  if (error) {
    console.error('[sendDirectMessage]', error);
    return;
  }

  const otherUserId = connection.requester_id === user.id ? connection.recipient_id : connection.requester_id;
  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle();
  await notifyUser(supabase, otherUserId, `Neue Nachricht von ${profile?.display_name ?? 'jemandem'}.`, `/network/chat/${connectionId}`);

  revalidatePath(`/network/chat/${connectionId}`);
}
