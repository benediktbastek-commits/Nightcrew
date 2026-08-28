'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function toggleTask(id: string, done: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from('tasks').update({ done: !done }).eq('id', id);
  if (error) console.error('[toggleTask]', error);
  revalidatePath('/');
}

export async function createTask(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  if (!title) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('tasks').insert({ title, user_id: user.id, scope: 'general' });
  if (error) console.error('[createTask]', error);
  revalidatePath('/');
}
