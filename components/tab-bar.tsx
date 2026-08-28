import { createClient } from '@/lib/supabase/server';
import { hasRole } from '@/lib/roles';
import { isOwnerEmail } from '@/lib/owner';
import type { Profile } from '@/lib/types';
import { TabBarClient } from './tab-bar-client';

// Kalender ist rollenoffen: er zeigt user-gescopte Daten aus mehreren Tabellen
// (siehe lib/calendar.ts) und braucht keine Rollen-Logik. Jede Rollen-Tab-Liste
// unten sollte CALENDAR_TAB enthalten — auch neue Kontotypen, die später dazukommen.
const CALENDAR_TAB = { href: '/calendar', label: 'KALENDER' };
const CONTENT_TAB = { href: '/content', label: 'CONTENT' };
const CLAUDE_TAB = { href: '/claude', label: 'CLAUDE' };

const DJ_TABS = [
  { href: '/', label: 'ÜBERBLICK' },
  { href: '/bookings', label: 'BOOKINGS' },
  CONTENT_TAB,
  { href: '/releases', label: 'RELEASES' },
  CALENDAR_TAB,
  { href: '/analytics', label: 'ANALYTICS' },
  CLAUDE_TAB,
];

const PHOTOGRAPHER_BASE_TABS = [
  { href: '/', label: 'ÜBERBLICK' },
  { href: '/bookings', label: 'AUFTRÄGE' },
  CALENDAR_TAB,
  { href: '/marketplace', label: 'MARKTPLATZ' },
];

export async function TabBar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profileData } = user
    ? await supabase.from('profiles').select('roles, wants_content, ai_unlocked').eq('id', user.id).maybeSingle()
    : { data: null };
  const roles = (profileData?.roles ?? []) as Profile['roles'];
  const isPhotographerOnly = hasRole(roles, 'photographer_videographer') && !hasRole(roles, 'dj_producer');

  if (!isPhotographerOnly) return <TabBarClient tabs={DJ_TABS} />;

  // Fotografen bekommen Content & Claude optional dazu — Content per Einstellungs-Schalter,
  // Claude sobald ein Zugangscode eingelöst wurde (siehe app/(app)/settings/page.tsx).
  const aiUnlocked = isOwnerEmail(user?.email) || !!profileData?.ai_unlocked;
  const tabs = [...PHOTOGRAPHER_BASE_TABS];
  if (profileData?.wants_content) tabs.splice(2, 0, CONTENT_TAB);
  if (aiUnlocked) tabs.push(CLAUDE_TAB);

  return <TabBarClient tabs={tabs} />;
}
