'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { ContactRole } from '@/lib/types';

function readContactFields(formData: FormData) {
  return {
    name: String(formData.get('name') ?? '').trim(),
    organisation: String(formData.get('organisation') ?? '').trim() || null,
    role: String(formData.get('role') ?? 'booking') as ContactRole,
    email: String(formData.get('email') ?? '').trim() || null,
    phone: String(formData.get('phone') ?? '').trim() || null,
    last_contact_at: String(formData.get('last_contact_at') ?? '') || null,
    notes: String(formData.get('notes') ?? '').trim() || null,
  };
}

export async function createContact(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase.from('contacts').insert({ ...readContactFields(formData), user_id: user.id });
  if (error) console.error('[createContact]', error);

  revalidatePath('/contacts');
  revalidatePath('/');
  redirect('/contacts');
}

export async function updateContact(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from('contacts').update(readContactFields(formData)).eq('id', id);
  if (error) console.error('[updateContact]', error);

  revalidatePath('/contacts');
  redirect('/contacts');
}

export async function deleteContact(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('contacts').delete().eq('id', id);
  if (error) console.error('[deleteContact]', error);

  revalidatePath('/contacts');
  revalidatePath('/');
  redirect('/contacts');
}
