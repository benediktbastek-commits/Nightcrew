import Link from 'next/link';
import { Screen } from '@/components/screen';
import { createClient } from '@/lib/supabase/server';
import { acceptConnection, declineConnection, removeConnection, sendConnectionRequest } from './actions';
import type { Connection, Profile, Role } from '@/lib/types';

const ROLE_LABEL: Record<Role, string> = {
  dj_producer: 'DJ / PRODUCER',
  photographer_videographer: 'FOTOGRAF / VIDEOGRAF',
  manager: 'MANAGER',
};

type MiniProfile = Pick<Profile, 'id' | 'display_name' | 'roles' | 'city'>;

export default async function NetworkPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const query = (searchParams.q ?? '').trim();

  const [{ data: myConnectionsData }, { data: searchData }] = await Promise.all([
    supabase.from('connections').select('*').or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`),
    query
      ? supabase.from('profiles').select('id, display_name, roles, city').ilike('display_name', `%${query}%`).neq('id', user.id).limit(20)
      : Promise.resolve({ data: [] as MiniProfile[] }),
  ]);

  const connections = (myConnectionsData ?? []) as Connection[];
  const incoming = connections.filter((c) => c.recipient_id === user.id && c.status === 'pending');
  const outgoing = connections.filter((c) => c.requester_id === user.id && c.status === 'pending');
  const accepted = connections.filter((c) => c.status === 'accepted');
  const searchResults = (searchData ?? []) as MiniProfile[];

  const otherIds = Array.from(new Set([
    ...incoming.map((c) => c.requester_id),
    ...outgoing.map((c) => c.recipient_id),
    ...accepted.map((c) => (c.requester_id === user.id ? c.recipient_id : c.requester_id)),
  ]));
  const { data: otherProfilesData } = otherIds.length > 0
    ? await supabase.from('profiles').select('id, display_name, roles, city').in('id', otherIds)
    : { data: [] as MiniProfile[] };
  const profileById = new Map(((otherProfilesData ?? []) as MiniProfile[]).map((p) => [p.id, p]));

  const connectionByOtherId = new Map(connections.map((c) => [c.requester_id === user.id ? c.recipient_id : c.requester_id, c]));

  return (
    <Screen title="NETZWERK" back="/">
      <form className="quick-add">
        <input className="field" name="q" placeholder="Nach Namen suchen …" defaultValue={query} />
        <button type="submit" className="button">⌕</button>
      </form>

      {query && (
        <section>
          <div className="row section-heading"><span className="label">SUCHERGEBNISSE</span><span className="muted">{searchResults.length}</span></div>
          {searchResults.length === 0 ? (
            <p className="empty-state">Keine Treffer.</p>
          ) : (
            searchResults.map((profile) => {
              const existing = connectionByOtherId.get(profile.id);
              return (
                <div className="platform-row" key={profile.id}>
                  <div className="platform-row-top">
                    <Link href={`/profile/${profile.id}`} className="platform-name profile-link">{profile.display_name ?? 'Unbekannt'}</Link>
                    {!existing || existing.status === 'declined' ? (
                      <form action={sendConnectionRequest.bind(null, profile.id)}>
                        <button type="submit" className="edit-link">VERBINDEN</button>
                      </form>
                    ) : existing.status === 'pending' && existing.requester_id === user.id ? (
                      <span className="muted">ANGEFRAGT</span>
                    ) : existing.status === 'pending' ? (
                      <span className="muted">HAT DICH ANGEFRAGT</span>
                    ) : (
                      <Link href={`/network/chat/${existing.id}`} className="edit-link">CHAT</Link>
                    )}
                  </div>
                  <p className="meta">{(profile.roles ?? []).map((r) => ROLE_LABEL[r]).join(' · ')}{profile.city ? ` · ${profile.city}` : ''}</p>
                </div>
              );
            })
          )}
        </section>
      )}

      {incoming.length > 0 && (
        <section>
          <div className="row section-heading"><span className="label">ANFRAGEN AN DICH</span><span className="muted">{incoming.length}</span></div>
          {incoming.map((c) => {
            const profile = profileById.get(c.requester_id);
            return (
              <div className="panel" style={{ marginBottom: 10 }} key={c.id}>
                <Link href={`/profile/${c.requester_id}`} className="platform-name profile-link">{profile?.display_name ?? 'Unbekannt'}</Link>
                <div className="button-row" style={{ marginTop: 10 }}>
                  <form action={acceptConnection.bind(null, c.id)} style={{ flex: 1 }}><button type="submit" className="button solid-button">ANNEHMEN</button></form>
                  <form action={declineConnection.bind(null, c.id)} style={{ flex: 1 }}><button type="submit" className="button">ABLEHNEN</button></form>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {outgoing.length > 0 && (
        <section>
          <div className="row section-heading"><span className="label">DEINE OFFENEN ANFRAGEN</span><span className="muted">{outgoing.length}</span></div>
          {outgoing.map((c) => {
            const profile = profileById.get(c.recipient_id);
            return (
              <div className="platform-row" key={c.id}>
                <div className="platform-row-top">
                  <Link href={`/profile/${c.recipient_id}`} className="platform-name profile-link">{profile?.display_name ?? 'Unbekannt'}</Link>
                  <form action={removeConnection.bind(null, c.id)}><button type="submit" className="edit-link">ZURÜCKZIEHEN</button></form>
                </div>
              </div>
            );
          })}
        </section>
      )}

      <section>
        <div className="row section-heading"><span className="label">MEINE VERBINDUNGEN</span><span className="muted">{accepted.length}</span></div>
        {accepted.length === 0 ? (
          <p className="empty-state">Noch keine Verbindungen — such oben nach Namen.</p>
        ) : (
          accepted.map((c) => {
            const otherId = c.requester_id === user.id ? c.recipient_id : c.requester_id;
            const profile = profileById.get(otherId);
            return (
              <div className="platform-row" key={c.id}>
                <div className="platform-row-top">
                  <Link href={`/profile/${otherId}`} className="platform-name profile-link">{profile?.display_name ?? 'Unbekannt'}</Link>
                  <Link href={`/network/chat/${c.id}`} className="edit-link">CHAT</Link>
                </div>
              </div>
            );
          })
        )}
      </section>
    </Screen>
  );
}
