import { createClient } from '@/lib/supabase/server';
import { isOwnerEmail } from '@/lib/owner';

export async function hasAiAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  if (isOwnerEmail(user.email)) return true;

  const { data: profile } = await supabase.from('profiles').select('ai_unlocked').eq('id', user.id).maybeSingle();
  return profile?.ai_unlocked ?? false;
}
