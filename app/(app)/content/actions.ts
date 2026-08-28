'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { PostFormat, PostPlatform, PostStatus } from '@/lib/types';

export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const plannedAt = String(formData.get('planned_at') ?? '');

  const { error } = await supabase.from('posts').insert({
    user_id: user.id,
    platform: String(formData.get('platform') ?? 'instagram') as PostPlatform,
    format: String(formData.get('format') ?? 'reel') as PostFormat,
    caption: String(formData.get('caption') ?? '').trim() || null,
    planned_at: plannedAt ? new Date(plannedAt).toISOString() : null,
    status: String(formData.get('status') ?? 'idea') as PostStatus,
    release_id: String(formData.get('release_id') ?? '') || null,
  });
  if (error) console.error('[createPost]', error);

  revalidatePath('/content');
  revalidatePath('/releases');
  revalidatePath('/releases/[id]', 'page');
  redirect('/content');
}

export async function updatePost(id: string, formData: FormData) {
  const supabase = await createClient();
  const plannedAt = String(formData.get('planned_at') ?? '');

  const { error } = await supabase.from('posts').update({
    platform: String(formData.get('platform') ?? 'instagram') as PostPlatform,
    format: String(formData.get('format') ?? 'reel') as PostFormat,
    caption: String(formData.get('caption') ?? '').trim() || null,
    planned_at: plannedAt ? new Date(plannedAt).toISOString() : null,
    status: String(formData.get('status') ?? 'idea') as PostStatus,
    release_id: String(formData.get('release_id') ?? '') || null,
  }).eq('id', id);
  if (error) console.error('[updatePost]', error);

  revalidatePath('/content');
  revalidatePath('/releases');
  revalidatePath('/releases/[id]', 'page');
  redirect('/content');
}
