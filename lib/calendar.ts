import type { SupabaseClient } from '@supabase/supabase-js';

export type CalendarEventType = 'gig' | 'content' | 'release' | 'deadline' | 'invoice';

export type CalendarEvent = {
  date: string;
  time: string | null;
  type: CalendarEventType;
  label: string;
  link: string;
  dim?: boolean;
};

export const CALENDAR_TYPES: { type: CalendarEventType; label: string; color: string }[] = [
  { type: 'gig', label: 'GIG', color: '#f2b84b' },
  { type: 'content', label: 'CONTENT', color: '#6fb8ff' },
  { type: 'release', label: 'RELEASE', color: '#c792ff' },
  { type: 'deadline', label: 'DEADLINE', color: '#ff6b6b' },
  { type: 'invoice', label: 'RECHNUNG', color: '#5fd9a0' },
];

// Rollenoffen: fragt Tabellen ab, die es geben könnte, ohne nach Rolle zu unterscheiden.
// RLS scoped jede Tabelle bereits auf den eingeloggten User — Tabellen, die für eine Rolle
// nicht zutreffen (z.B. Releases für Fotografen), liefern einfach 0 Zeilen zurück. Ein neuer
// Kontotyp bekommt den Kalender damit automatisch, sobald seine Daten user-gescoped sind —
// keine Rollenverzweigung hier nötig, siehe components/tab-bar.tsx für den Tab-Eintrag.
export async function getCalendarEvents(supabase: SupabaseClient): Promise<CalendarEvent[]> {
  const [{ data: gigs }, { data: posts }, { data: releases }, { data: deadlines }, { data: invoices }] = await Promise.all([
    supabase.from('gigs').select('id, venue, city, date, set_start, status'),
    supabase.from('posts').select('id, caption, platform, planned_at').not('planned_at', 'is', null),
    supabase.from('releases').select('id, title, release_date'),
    supabase.from('release_deadlines').select('id, release_id, title, due_date, done').eq('done', false),
    supabase.from('invoices').select('id, number, recipient, due_on, status').not('due_on', 'is', null).not('status', 'eq', 'paid'),
  ]);

  const events: CalendarEvent[] = [];

  for (const g of gigs ?? []) {
    events.push({ date: g.date, time: g.set_start, type: 'gig', label: `${g.venue} · ${g.city}`, link: `/bookings/${g.id}/edit`, dim: g.status === 'option' });
  }
  for (const p of posts ?? []) {
    events.push({ date: p.planned_at.slice(0, 10), time: p.planned_at.slice(11, 16), type: 'content', label: p.caption ?? p.platform, link: `/content/${p.id}/edit` });
  }
  for (const r of releases ?? []) {
    events.push({ date: r.release_date, time: null, type: 'release', label: r.title, link: `/releases/${r.id}` });
  }
  for (const d of deadlines ?? []) {
    events.push({ date: d.due_date, time: null, type: 'deadline', label: d.title, link: `/releases/${d.release_id}` });
  }
  for (const inv of invoices ?? []) {
    events.push({ date: inv.due_on as string, time: null, type: 'invoice', label: `${inv.number} · ${inv.recipient}`, link: `/finance/${inv.id}/edit` });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''));
}
