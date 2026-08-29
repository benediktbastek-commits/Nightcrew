'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isValidUsername, normalizeUsername } from '@/lib/username';
import type { Role } from '@/lib/types';

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const roles = formData.getAll('roles') as Role[];
  const displayName = String(formData.get('display_name') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim();
  const username = normalizeUsername(String(formData.get('username') ?? ''));

  if (!isValidUsername(username)) return { error: 'invalid_username' };

  const { data: taken } = await supabase.from('profiles').select('id').eq('username', username).neq('id', user.id).maybeSingle();
  if (taken) return { error: 'username_taken' };

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    display_name: displayName || null,
    status: status || null,
    roles,
    username,
    onboarded_at: new Date().toISOString(),
  });
  if (error) {
    console.error('[completeOnboarding]', error);
    return { error: error.code === '23505' ? 'username_taken' : 'save_failed' };
  }

  redirect('/tutorial');
}
