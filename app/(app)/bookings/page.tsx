import { Screen } from '@/components/screen';
import { createClient } from '@/lib/supabase/server';
import { hasRole } from '@/lib/roles';
import { BookingsScreen } from './bookings-screen';
import { PhotographerBookingsScreen } from './photographer-bookings-screen';
import type { Gig, Contact, Profile } from '@/lib/types';

export default async function BookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profileData } = user
    ? await supabase.from('profiles').select('roles').eq('id', user.id).maybeSingle()
    : { data: null };
  const roles = (profileData?.roles ?? []) as Profile['roles'];
  const isPhotographerOnly = hasRole(roles, 'photographer_videographer') && !hasRole(roles, 'dj_producer');

  if (isPhotographerOnly) {
    const { data: gigs, error } = await supabase.from('gigs').select('*').order('date', { ascending: true });
    if (error) console.error('[BookingsPage] photographer gigs', error);
    return (
      <Screen title="MEINE AUFTRÄGE">
        <PhotographerBookingsScreen gigs={(gigs ?? []) as Gig[]} />
      </Screen>
    );
  }

  const [{ data: gigs, error: gigsError }, { data: contacts, error: contactsError }, { data: matchedRequests }] = await Promise.all([
    supabase.from('gigs').select('*').order('date', { ascending: true }),
    supabase.from('contacts').select('*').order('name', { ascending: true }),
    supabase.from('service_requests').select('gig_id').eq('status', 'matched').not('gig_id', 'is', null),
  ]);
  if (gigsError) console.error('[BookingsPage] gigs', gigsError);
  if (contactsError) console.error('[BookingsPage] contacts', contactsError);

  const photographerConfirmedGigIds = (matchedRequests ?? []).map((r) => r.gig_id as string);

  return (
    <Screen title="BOOKINGS">
      <BookingsScreen gigs={(gigs ?? []) as Gig[]} contacts={(contacts ?? []) as Contact[]} photographerConfirmedGigIds={photographerConfirmedGigIds} />
    </Screen>
  );
}
