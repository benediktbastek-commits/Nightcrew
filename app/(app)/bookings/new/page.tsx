import { Screen } from '@/components/screen';
import { createClient } from '@/lib/supabase/server';
import { hasRole } from '@/lib/roles';
import { GigForm } from '../gig-form';
import { PhotographerGigForm } from '../photographer-gig-form';
import { createGig } from '../actions';
import type { Contact, Profile } from '@/lib/types';

export default async function NewGigPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profileData } = user
    ? await supabase.from('profiles').select('roles').eq('id', user.id).maybeSingle()
    : { data: null };
  const roles = (profileData?.roles ?? []) as Profile['roles'];
  const isPhotographerOnly = hasRole(roles, 'photographer_videographer') && !hasRole(roles, 'dj_producer');

  if (isPhotographerOnly) {
    return (
      <Screen title="NEUER AUFTRAG" back="/bookings">
        <PhotographerGigForm mode="create" action={createGig} />
      </Screen>
    );
  }

  const { data: contacts } = await supabase.from('contacts').select('*').order('name', { ascending: true });
  return (
    <Screen title="NEUER GIG" back="/bookings">
      <GigForm mode="create" contacts={(contacts ?? []) as Contact[]} action={createGig} />
    </Screen>
  );
}
