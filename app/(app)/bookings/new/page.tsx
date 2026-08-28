import { createClient } from '@/lib/supabase/server';
import { GigForm } from '../gig-form';
import { createGig } from '../actions';
import type { Contact } from '@/lib/types';

export default async function NewGigPage() {
  const supabase = await createClient();
  const { data: contacts } = await supabase.from('contacts').select('*').order('name', { ascending: true });

  return <GigForm mode="create" contacts={(contacts ?? []) as Contact[]} action={createGig} />;
}
