'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isOwnerEmail } from '@/lib/owner';
import { isValidUsername, normalizeUsername } from '@/lib/username';
import type { Role } from '@/lib/types';

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const roles = formData.getAll('roles') as Role[];
  const displayName = String(formData.get('display_name') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim();
  const avatarUrl = String(formData.get('avatar_url') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();
  const bio = String(formData.get('bio') ?? '').trim();
  const username = normalizeUsername(String(formData.get('username') ?? ''));

  if (!isValidUsername(username)) return { error: 'invalid_username' };

  const { data: taken } = await supabase.from('profiles').select('id').eq('username', username).neq('id', user.id).maybeSingle();
  if (taken) return { error: 'username_taken' };
  const socials = {
    instagram: String(formData.get('social_instagram') ?? '').trim() || null,
    tiktok: String(formData.get('social_tiktok') ?? '').trim() || null,
    youtube: String(formData.get('social_youtube') ?? '').trim() || null,
    spotify: String(formData.get('social_spotify') ?? '').trim() || null,
    website: String(formData.get('social_website') ?? '').trim() || null,
  };

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName || null,
      status: status || null,
      roles,
      city: city || null,
      bio: bio || null,
      socials,
      username,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq('id', user.id);
  if (error) {
    console.error('[updateProfile]', error);
    return { error: error.code === '23505' ? 'username_taken' : 'save_failed' };
  }

  revalidatePath('/settings');
  revalidatePath('/');
  return { error: null };
}

export async function updatePhotographerDetails(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const skills = String(formData.get('skills') ?? '')
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);

  const portfolio = String(formData.get('portfolio') ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, url] = line.split('|').map((part) => part.trim());
      return { title: title || url || 'Referenz', url: url || '' };
    });

  const { error } = await supabase.from('profiles').update({ skills, portfolio }).eq('id', user.id);
  if (error) console.error('[updatePhotographerDetails]', error);

  revalidatePath('/settings');
}

export async function toggleContentModule(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const wantsContent = formData.get('wants_content') === 'on';

  const { error } = await supabase.from('profiles').update({ wants_content: wantsContent }).eq('id', user.id);
  if (error) console.error('[toggleContentModule]', error);

  revalidatePath('/settings');
  revalidatePath('/');
}

export async function submitFeedback(formData: FormData) {
  const message = String(formData.get('message') ?? '').trim();
  if (!message) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('feedback').insert({ user_id: user.id, message });
  if (error) console.error('[submitFeedback]', error);

  revalidatePath('/settings');
}

export async function grantAiAccessByEmail(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isOwnerEmail(user.email)) redirect('/');

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!email) redirect('/settings?ai_error=missing_email');

  const { error } = await supabase.rpc('set_ai_access', { target_email: email, unlocked: true });
  if (error) {
    console.error('[grantAiAccessByEmail]', error);
    redirect(`/settings?ai_error=${error.message.includes('user_not_found') ? 'user_not_found' : 'failed'}`);
  }

  revalidatePath('/settings');
  redirect('/settings');
}

export async function revokeAiAccessById(profileId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isOwnerEmail(user.email)) return;

  const { error } = await supabase.rpc('set_ai_access_by_id', { target_id: profileId, unlocked: false });
  if (error) console.error('[revokeAiAccessById]', error);

  revalidatePath('/settings');
}
