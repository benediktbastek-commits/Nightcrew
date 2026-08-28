import type { SupabaseClient } from '@supabase/supabase-js';

export async function notifyUser(supabase: SupabaseClient, targetUserId: string, message: string, link?: string) {
  const { error } = await supabase.rpc('notify_user', { target_user_id: targetUserId, message, link: link ?? null });
  if (error) console.error('[notifyUser]', error);
}
