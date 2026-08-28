import Link from 'next/link';
import { Screen } from '@/components/screen';
import { createClient } from '@/lib/supabase/server';
import { formatDayMonth } from '@/lib/format';
import type { Contact, ContactRole } from '@/lib/types';

const ROLE_GROUPS: { key: ContactRole; label: string }[] = [
  { key: 'booking', label: 'BOOKING' },
  { key: 'label_promo', label: 'LABEL / PROMO' },
  { key: 'crew', label: 'CREW' },
];

export default async function ContactsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('contacts').select('*').order('name', { ascending: true });
  if (error) console.error('[ContactsPage]', error);
  const contacts = (data ?? []) as Contact[];

  return (
    <Screen title="KONTAKTE" back="/">
      {ROLE_GROUPS.map((group) => {
        const items = contacts.filter((contact) => contact.role === group.key);
        return (
          <section key={group.key}>
            <div className="row section-heading"><span className="label">{group.label}</span><span className="muted">{items.length}</span></div>
            {items.length === 0 ? (
              <p className="empty-state">Keine Kontakte.</p>
            ) : (
              items.map((contact) => (
                <Link href={`/contacts/${contact.id}/edit`} className="invoice-row" key={contact.id}>
                  <div className="grow">
                    <strong>{contact.name}</strong>
                    <span className="gig-row-time">
                      {[contact.organisation, contact.email, contact.phone].filter(Boolean).join(' · ') || '—'}
                    </span>
                  </div>
                  {contact.last_contact_at && <span className="muted">{formatDayMonth(contact.last_contact_at)}</span>}
                </Link>
              ))
            )}
          </section>
        );
      })}

      <Link href="/contacts/new" className="claude-link">+ KONTAKT ANLEGEN <span>›</span></Link>
    </Screen>
  );
}
