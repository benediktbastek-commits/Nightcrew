import { createClient } from '@/lib/supabase/server';
import { hasRole } from '@/lib/roles';
import { isOwnerEmail } from '@/lib/owner';
import { wantsFeature } from '@/lib/features';
import type { Profile } from '@/lib/types';
import { TabBarClient } from './tab-bar-client';

// Kalender ist rollenoffen: er zeigt user-gescopte Daten aus mehreren Tabellen
// (siehe lib/calendar.ts) und braucht keine Rollen-Logik. Jede Rollen-Tab-Liste
// unten sollte CALENDAR_TAB enthalten — auch neue Kontotypen, die später dazukommen.
const HOME_TAB = { href: '/', label: 'ÜBERBLICK' };
const CALENDAR_TAB = { href: '/calendar', label: 'KALENDER' };
const CONTENT_TAB = { href: '/content', label: 'CONTENT' };
const CREW_AI_TAB = { href: '/crew-ai', label: 'CREW AI' };
const MARKETPLACE_TAB = { href: '/marketplace', label: 'MARKTPLATZ' };

export async function TabBar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profileData } = user
    ? await supabase.from('profiles').select('roles, wants_content, wants_bookings, wants_releases, wants_analytics, wants_marketplace, wants_crew_ai, ai_unlocked').eq('id', user.id).maybeSingle()
    : { data: null };
  const roles = (profileData?.roles ?? []) as Profile['roles'];
  const isPhotographerOnly = hasRole(roles, 'photographer_videographer') && !hasRole(roles, 'dj_producer');
  const aiUnlocked = isOwnerEmail(user?.email) || !!profileData?.ai_unlocked;
  const wantsCrewAi = wantsFeature(profileData, 'crew_ai');

  // Claude ist das große KI-Feature und bleibt deshalb — egal bei welcher Rolle —
  // der auffällig zentrierte Button in der Kompakt-Leiste, sobald verfügbar.
  // Fotografen ohne Freischaltung bekommen stattdessen den Marktplatz zentriert,
  // da Claude für sie dann noch gar nicht erreichbar ist. Wer Crew AI in den
  // Anzeigeeinstellungen abgewählt hat, bekommt stattdessen den Kalender zentriert.
  const centerTab = !wantsCrewAi
    ? (isPhotographerOnly ? MARKETPLACE_TAB : CALENDAR_TAB)
    : (isPhotographerOnly && !aiUnlocked ? MARKETPLACE_TAB : CREW_AI_TAB);

  const djMenu = [
    ...(wantsFeature(profileData, 'bookings') ? [{ href: '/bookings', label: 'BOOKINGS' }] : []),
    ...(wantsFeature(profileData, 'content') ? [CONTENT_TAB] : []),
    ...(wantsFeature(profileData, 'releases') ? [{ href: '/releases', label: 'RELEASES' }] : []),
    CALENDAR_TAB,
    ...(wantsFeature(profileData, 'analytics') ? [{ href: '/analytics', label: 'ANALYTICS' }] : []),
  ];
  const photographerMenu = [
    { href: '/bookings', label: 'AUFTRÄGE' },
    ...(profileData?.wants_content ? [CONTENT_TAB] : []),
    CALENDAR_TAB,
    ...(wantsFeature(profileData, 'marketplace') ? [MARKETPLACE_TAB] : []),
    ...(aiUnlocked && wantsCrewAi ? [CREW_AI_TAB] : []),
  ];
  const menuTabs = (isPhotographerOnly ? photographerMenu : djMenu).filter((tab) => tab.href !== centerTab.href);

  return <TabBarClient homeTab={HOME_TAB} centerTab={centerTab} menuTabs={menuTabs} />;
}
