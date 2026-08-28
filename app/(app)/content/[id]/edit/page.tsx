import { notFound } from 'next/navigation';
import { Screen } from '@/components/screen';
import { createClient } from '@/lib/supabase/server';
import { PostForm } from '../../post-form';
import { updatePost } from '../../actions';
import type { Post, Release } from '@/lib/types';

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const [{ data: post }, { data: releases }] = await Promise.all([
    supabase.from('posts').select('*').eq('id', params.id).single(),
    supabase.from('releases').select('*').order('release_date', { ascending: true }),
  ]);

  if (!post) notFound();

  return (
    <Screen title="POST BEARBEITEN" back="/content">
      <PostForm mode="edit" post={post as Post} releases={(releases ?? []) as Release[]} action={updatePost.bind(null, params.id)} />
    </Screen>
  );
}
