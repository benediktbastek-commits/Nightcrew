import type { Profile } from './types';

export type FeatureKey =
  | 'bookings'
  | 'content'
  | 'releases'
  | 'analytics'
  | 'finance'
  | 'tour'
  | 'marketplace'
  | 'network'
  | 'crew_ai';

export const FEATURE_COLUMN: Record<FeatureKey, keyof Profile> = {
  bookings: 'wants_bookings',
  content: 'wants_content',
  releases: 'wants_releases',
  analytics: 'wants_analytics',
  finance: 'wants_finance',
  tour: 'wants_tour',
  marketplace: 'wants_marketplace',
  network: 'wants_network',
  crew_ai: 'wants_crew_ai',
};

export const FEATURE_OPTIONS: { key: FeatureKey; label: string; text: string }[] = [
  { key: 'bookings', label: 'BOOKINGS', text: 'Gigs bzw. Aufträge anlegen und verwalten.' },
  { key: 'content', label: 'CONTENT', text: 'Posts planen, Wochenübersicht.' },
  { key: 'releases', label: 'RELEASES', text: 'Zeitstrahl, Tracks und Deadlines pro Release.' },
  { key: 'analytics', label: 'ANALYTICS', text: 'Screenshot-Import und Social-Media-Zahlen.' },
  { key: 'finance', label: 'FINANZEN', text: 'Rechnungen und Ausgaben.' },
  { key: 'tour', label: 'TOUR & LOGISTIK', text: 'Reise- und Rider-Checkliste je Gig.' },
  { key: 'marketplace', label: 'MARKTPLATZ', text: 'Fotograf:innen/Videograf:innen für Gigs finden — oder Anfragen annehmen.' },
  { key: 'network', label: 'NETZWERK', text: 'Andere Nutzer:innen finden und chatten.' },
  { key: 'crew_ai', label: 'CREW AI', text: 'KI-Planer für Content-Ideen.' },
];

// Fehlt der Wert (z.B. weil nur eine Teilmenge der Profil-Spalten geladen wurde),
// wird das Feature nie fälschlich ausgeblendet — nur ein explizites false versteckt es.
export function wantsFeature(profile: Partial<Record<keyof Profile, unknown>> | null | undefined, key: FeatureKey): boolean {
  if (!profile) return true;
  const value = profile[FEATURE_COLUMN[key]];
  return value !== false;
}
