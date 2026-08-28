'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isOwnerEmail } from '@/lib/owner';
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
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq('id', user.id);
  if (error) console.error('[updateProfile]', error);

  revalidatePath('/settings');
  revalidatePath('/');
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

export async function redeemAccessCode(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthorized' };

  const code = String(formData.get('code') ?? '').trim();
  if (!code) return { error: 'missing_code' };

  const { data: match } = await supabase
    .from('access_codes')
    .select('id')
    .eq('code', code)
    .is('redeemed_by', null)
    .eq('revoked', false)
    .maybeSingle();
  if (!match) return { error: 'invalid_code' };

  const { error: redeemError } = await supabase
    .from('access_codes')
    .update({ redeemed_by: user.id, redeemed_at: new Date().toISOString() })
    .eq('id', match.id);
  if (redeemError) {
    console.error('[redeemAccessCode]', redeemError);
    return { error: 'redeem_failed' };
  }

  const { error: profileError } = await supabase.from('profiles').update({ ai_unlocked: true }).eq('id', user.id);
  if (profileError) console.error('[redeemAccessCode] profile', profileError);

  revalidatePath('/settings');
  return { error: null };
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

export async function createAccessCode(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isOwnerEmail(user.email)) return;

  const label = String(formData.get('label') ?? '').trim() || null;
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();

  const { error } = await supabase.from('access_codes').insert({ code, label, created_by: user.id });
  if (error) console.error('[createAccessCode]', error);

  revalidatePath('/settings');
}

export async function revokeAccessCode(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isOwnerEmail(user.email)) return;

  const { error } = await supabase.from('access_codes').update({ revoked: true }).eq('id', id).eq('created_by', user.id);
  if (error) console.error('[revokeAccessCode]', error);

  revalidatePath('/settings');
}
