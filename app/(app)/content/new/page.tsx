import { createClient } from '@/lib/supabase/server';
import { PostForm } from '../post-form';
import { createPost } from '../actions';
import type { Release } from '@/lib/types';

export default async function NewPostPage() {
  const supabase = await createClient();
  const { data: releases } = await supabase.from('releases').select('*').order('release_date', { ascending: true });

  return <PostForm mode="create" releases={(releases ?? []) as Release[]} action={createPost} />;
}
