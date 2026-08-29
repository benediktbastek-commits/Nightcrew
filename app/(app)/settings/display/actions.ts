'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { FEATURE_COLUMN, FEATURE_OPTIONS } from '@/lib/features';

export async function updateFeaturePrefs(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const update: Record<string, boolean> = {};
  for (const feature of FEATURE_OPTIONS) {
    update[FEATURE_COLUMN[feature.key]] = formData.get(feature.key) === 'on';
  }

  const { error } = await supabase.from('profiles').update(update).eq('id', user.id);
  if (error) console.error('[updateFeaturePrefs]', error);

  revalidatePath('/settings/display');
  revalidatePath('/');
}
