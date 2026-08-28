import { createClient } from '@/lib/supabase/server';
import { BookingsScreen } from './bookings-screen';
import type { Gig, Contact } from '@/lib/types';

export default async function BookingsPage() {
  const supabase = await createClient();
  const [{ data: gigs, error: gigsError }, { data: contacts, error: contactsError }] = await Promise.all([
    supabase.from('gigs').select('*').order('date', { ascending: true }),
    supabase.from('contacts').select('*').order('name', { ascending: true }),
  ]);
  if (gigsError) console.error('[BookingsPage] gigs', gigsError);
  if (contactsError) console.error('[BookingsPage] contacts', contactsError);

  return <BookingsScreen gigs={(gigs ?? []) as Gig[]} contacts={(contacts ?? []) as Contact[]} />;
}
