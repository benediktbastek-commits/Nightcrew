import { notFound } from 'next/navigation';
import { Screen } from '@/components/screen';
import { createClient } from '@/lib/supabase/server';
import { hasRole } from '@/lib/roles';
import { GigForm } from '../../gig-form';
import { PhotographerGigForm } from '../../photographer-gig-form';
import { updateGig } from '../../actions';
import type { Contact, Gig, Profile } from '@/lib/types';

export default async function EditGigPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: gig }, { data: profileData }] = await Promise.all([
    supabase.from('gigs').select('*').eq('id', params.id).single(),
    user ? supabase.from('profiles').select('roles').eq('id', user.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  if (!gig) notFound();
  const roles = (profileData?.roles ?? []) as Profile['roles'];
  const isPhotographerOnly = hasRole(roles, 'photographer_videographer') && !hasRole(roles, 'dj_producer');

  if (isPhotographerOnly) {
    return (
      <Screen title="AUFTRAG BEARBEITEN" back="/bookings">
        <PhotographerGigForm mode="edit" gig={gig as Gig} action={updateGig.bind(null, params.id)} />
      </Screen>
    );
  }

  const { data: contacts } = await supabase.from('contacts').select('*').order('name', { ascending: true });
  return (
    <Screen title="GIG BEARBEITEN" back="/bookings">
      <GigForm mode="edit" gig={gig as Gig} contacts={(contacts ?? []) as Contact[]} action={updateGig.bind(null, params.id)} />
    </Screen>
  );
}
