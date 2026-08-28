import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { GigForm } from '../../gig-form';
import { updateGig } from '../../actions';
import type { Contact, Gig } from '@/lib/types';

export default async function EditGigPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const [{ data: gig }, { data: contacts }] = await Promise.all([
    supabase.from('gigs').select('*').eq('id', params.id).single(),
    supabase.from('contacts').select('*').order('name', { ascending: true }),
  ]);

  if (!gig) notFound();

  return <GigForm mode="edit" gig={gig as Gig} contacts={(contacts ?? []) as Contact[]} action={updateGig.bind(null, params.id)} />;
}
