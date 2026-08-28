'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function markAllRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
  if (error) console.error('[markAllRead]', error);

  revalidatePath('/notifications');
  revalidatePath('/');
}

export async function markRead(id: string, link: string | null) {
  const supabase = await createClient();
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) console.error('[markRead]', error);
  revalidatePath('/notifications');
  revalidatePath('/');
  redirect(link || '/notifications');
}
