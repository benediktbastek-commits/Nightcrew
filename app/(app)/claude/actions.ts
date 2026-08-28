'use server';

import { createClient } from '@/lib/supabase/server';
import type { PostPlatform } from '@/lib/types';

export async function acceptPlanItem(itemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthorized' };

  const { data: item, error: itemError } = await supabase.from('ai_plan_items').select('*').eq('id', itemId).single();
  if (itemError || !item) return { error: 'not_found' };

  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      platform: item.platform as PostPlatform,
      format: 'reel',
      caption: item.idea,
      planned_at: `${item.planned_for}T12:00:00`,
      status: 'idea',
      ai_generated: true,
      source_plan_id: item.id,
    })
    .select('id')
    .single();
  if (postError || !post) {
    console.error('[acceptPlanItem] post', postError);
    return { error: 'save_failed' };
  }

  const { error: updateError } = await supabase.from('ai_plan_items').update({ accepted: true, post_id: post.id }).eq('id', itemId);
  if (updateError) console.error('[acceptPlanItem] update', updateError);

  return { error: null, postId: post.id };
}

export async function unacceptPlanItem(itemId: string) {
  const supabase = await createClient();
  const { data: item } = await supabase.from('ai_plan_items').select('post_id').eq('id', itemId).single();

  if (item?.post_id) {
    await supabase.from('posts').delete().eq('id', item.post_id);
  }
  const { error } = await supabase.from('ai_plan_items').update({ accepted: false, post_id: null }).eq('id', itemId);
  if (error) console.error('[unacceptPlanItem]', error);
  return { error: error ? 'save_failed' : null };
}
