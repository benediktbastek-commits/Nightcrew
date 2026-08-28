import { notFound } from 'next/navigation';
import { Screen } from '@/components/screen';
import { createClient } from '@/lib/supabase/server';
import { ContactForm } from '../../contact-form';
import { updateContact, deleteContact } from '../../actions';
import type { Contact } from '@/lib/types';

export default async function EditContactPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: contact } = await supabase.from('contacts').select('*').eq('id', params.id).single();

  if (!contact) notFound();

  return (
    <Screen title="KONTAKT BEARBEITEN" back="/contacts">
      <ContactForm mode="edit" contact={contact as Contact} action={updateContact.bind(null, params.id)} />
      <form action={deleteContact.bind(null, params.id)}>
        <button type="submit" className="edit-link">KONTAKT LÖSCHEN</button>
      </form>
    </Screen>
  );
}
