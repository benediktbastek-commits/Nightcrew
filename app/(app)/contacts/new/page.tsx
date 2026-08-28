import { Screen } from '@/components/screen';
import { ContactForm } from '../contact-form';
import { createContact } from '../actions';

export default function NewContactPage() {
  return (
    <Screen title="NEUER KONTAKT" back="/contacts">
      <ContactForm mode="create" action={createContact} />
    </Screen>
  );
}
