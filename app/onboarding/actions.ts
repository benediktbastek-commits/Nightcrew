'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Role } from '@/lib/types';

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const roles = formData.getAll('roles') as Role[];
  const displayName = String(formData.get('display_name') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim();

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    display_name: displayName || null,
    status: status || null,
    roles,
    onboarded_at: new Date().toISOString(),
  });
  if (error) console.error('[completeOnboarding]', error);

  redirect('/tutorial');
}
