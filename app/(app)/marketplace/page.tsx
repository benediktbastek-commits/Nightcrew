import Link from 'next/link';
import { Screen } from '@/components/screen';
import { Chip } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { hasRole } from '@/lib/roles';
import { formatDayMonth } from '@/lib/format';
import {
  acceptOffer,
  cancelRequest,
  createAvailability,
  createOffer,
  createRequest,
  declineOffer,
  deleteAvailability,
} from './actions';
import type { Gig, PhotographerAvailability, Profile, ServiceOffer, ServiceRequest, ServiceType } from '@/lib/types';

const SERVICE_LABEL: Record<ServiceType, string> = { photo: 'FOTO', video: 'VIDEO', both: 'FOTO + VIDEO' };

export default async function MarketplacePage({ searchParams }: { searchParams: { location?: string; target?: string; gig?: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const locationFilter = (searchParams.location ?? '').trim();
  const targetId = searchParams.target ?? '';
  const prefillGigId = searchParams.gig ?? '';

  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  const roles = (profileData?.roles ?? []) as Profile['roles'];
  const isDj = hasRole(roles, 'dj_producer');
  const today = new Date().toISOString().slice(0, 10);

  if (isDj) {
    const [{ data: requestsData }, { data: upcomingGigs }, { data: availabilityData }] = await Promise.all([
      supabase.from('service_requests').select('*').eq('dj_user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('gigs').select('*').gte('date', today).order('date', { ascending: true }),
      supabase.from('photographer_availability').select('*').gte('date', today).order('date', { ascending: true }),
    ]);
    const requests = (requestsData ?? []) as ServiceRequest[];
    const gigs = (upcomingGigs ?? []) as Gig[];
    const prefillGig = prefillGigId ? gigs.find((gig) => gig.id === prefillGigId) : null;
    let availability = (availabilityData ?? []) as PhotographerAvailability[];
    if (locationFilter) {
      availability = availability.filter((slot) => slot.location.toLowerCase().includes(locationFilter.toLowerCase()));
    }

    const requestIds = requests.map((r) => r.id);
    const { data: offersData } = requestIds.length > 0
      ? await supabase.from('service_offers').select('*').in('request_id', requestIds).order('created_at', { ascending: true })
      : { data: [] };
    const offers = (offersData ?? []) as ServiceOffer[];

    const photographerIds = Array.from(new Set([
      ...offers.map((o) => o.photographer_user_id),
      ...availability.map((slot) => slot.photographer_user_id),
    ]));
    const { data: photographerProfiles } = photographerIds.length > 0
      ? await supabase.from('profiles').select('id, display_name').in('id', photographerIds)
      : { data: [] };
    const nameById = new Map((photographerProfiles ?? []).map((p) => [p.id, p.display_name ?? 'Unbekannt']));
    const targetName = targetId ? (nameById.get(targetId) ?? 'Fotograf') : '';

    return (
      <Screen title="FOTOGRAF / VIDEOGRAF" back="/">
        <div>
          <div className="row section-heading"><span className="label">VERFÜGBARE FOTOGRAFEN</span><span className="muted">{availability.length}</span></div>
          <form className="quick-add" style={{ marginBottom: 10 }}>
            <input className="field" name="location" placeholder="Nach Standort filtern …" defaultValue={locationFilter} />
            <button type="submit" className="button">⌕</button>
          </form>
          {availability.length === 0 ? (
            <p className="empty-state">Keine Verfügbarkeiten gefunden.</p>
          ) : (
            availability.map((slot) => (
              <div className="platform-row" key={slot.id}>
                <div className="platform-row-top">
                  <Link href={`/profile/${slot.photographer_user_id}`} className="platform-name profile-link">{nameById.get(slot.photographer_user_id)}</Link>
                  <span className="muted">{formatDayMonth(slot.date)} · {slot.start_time}–{slot.end_time}</span>
                </div>
                <p className="meta">{slot.location}</p>
                <Link href={`/marketplace?target=${slot.photographer_user_id}#anfrage`} className="edit-link">ANFRAGEN</Link>
              </div>
            ))
          )}
        </div>

        <div>
          <div className="row section-heading"><span className="label">MEINE ANFRAGEN</span><span className="muted">{requests.length}</span></div>
          {requests.length === 0 ? (
            <p className="empty-state">Noch keine Anfragen.</p>
          ) : (
            requests.map((request) => {
              const requestOffers = offers.filter((o) => o.request_id === request.id);
              return (
                <div className="panel" style={{ marginBottom: 10 }} key={request.id}>
                  <div className="row">
                    <div>
                      <strong>{request.location}</strong>
                      <p className="meta">{formatDayMonth(request.date)} · {SERVICE_LABEL[request.service_type]}{request.target_photographer_id ? ` · AN ${nameById.get(request.target_photographer_id) ?? 'FOTOGRAF'}` : ''}</p>
                    </div>
                    <Chip tone={request.status === 'matched' ? 'solid' : request.status === 'cancelled' ? 'dim' : 'outline'}>
                      {request.status === 'matched' ? 'BESTÄTIGT' : request.status === 'cancelled' ? 'ABGEBROCHEN' : 'OFFEN'}
                    </Chip>
                  </div>
                  {request.status === 'open' && (
                    requestOffers.length === 0 ? (
                      <p className="empty-state">Noch keine Angebote.</p>
                    ) : (
                      requestOffers.filter((o) => o.status === 'pending').map((offer) => (
                        <div className="platform-row" key={offer.id}>
                          <div className="platform-row-top">
                            <Link href={`/profile/${offer.photographer_user_id}`} className="platform-name profile-link">{nameById.get(offer.photographer_user_id)}</Link>
                          </div>
                          {offer.message && <p className="meta">{offer.message}</p>}
                          <div className="button-row">
                            <form action={acceptOffer.bind(null, offer.id)}><button type="submit" className="button solid-button">ANNEHMEN</button></form>
                            <form action={declineOffer.bind(null, offer.id)}><button type="submit" className="button">ABLEHNEN</button></form>
                          </div>
                        </div>
                      ))
                    )
                  )}
                  {request.status === 'matched' && (
                    <>
                      <p className="meta">
                        Bestätigt: {request.matched_photographer_id ? (
                          <Link href={`/profile/${request.matched_photographer_id}`} className="profile-link">{nameById.get(request.matched_photographer_id) ?? 'Fotograf'}</Link>
                        ) : '—'}
                      </p>
                      <Link href={`/marketplace/chat/${request.id}`} className="edit-link">CHAT ÖFFNEN</Link>
                    </>
                  )}
                  {request.status === 'open' && (
                    <form action={cancelRequest.bind(null, request.id)}>
                      <button type="submit" className="edit-link">ANFRAGE ABBRECHEN</button>
                    </form>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div id="anfrage">
          <div className="row section-heading"><span className="label">NEUE ANFRAGE</span></div>
          {targetId && <p className="muted">Geht direkt an {targetName} — erscheint nicht im offenen Marktplatz.</p>}
          {prefillGig && <p className="muted">Vorausgefüllt aus deinem Gig &bdquo;{prefillGig.venue}&ldquo;.</p>}
          <form action={createRequest} className="auth-form">
            <input type="hidden" name="target_photographer_id" value={targetId} />
            <div className="form-field">
              <span className="label">ORT</span>
              <input className="field" name="location" placeholder="z.B. Köln" defaultValue={prefillGig?.city ?? ''} required />
            </div>
            <div className="form-row">
              <div className="form-field">
                <span className="label">DATUM</span>
                <input className="field" type="date" name="date" defaultValue={prefillGig?.date ?? ''} required />
              </div>
              <div className="form-field">
                <span className="label">ART</span>
                <select className="field" name="service_type" defaultValue="photo">
                  <option value="photo">Foto</option>
                  <option value="video">Video</option>
                  <option value="both">Foto + Video</option>
                </select>
              </div>
            </div>
            {gigs.length > 0 && (
              <div className="form-field">
                <span className="label">ZU GIG (OPTIONAL)</span>
                <select className="field" name="gig_id" defaultValue={prefillGig?.id ?? ''}>
                  <option value="">— kein Gig —</option>
                  {gigs.map((gig) => (
                    <option value={gig.id} key={gig.id}>{gig.venue} · {formatDayMonth(gig.date)}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-field">
              <span className="label">NOTIZEN</span>
              <textarea className="field" name="notes" placeholder="z.B. Ablauf, Dauer, Budget" />
            </div>
            <button type="submit" className="button solid-button">{targetId ? `AN ${targetName.toUpperCase()} SENDEN` : 'ANFRAGE STELLEN'}</button>
          </form>
        </div>
      </Screen>
    );
  }

  const [{ data: openRequestsData }, { data: targetedRequestsData }, { data: myOffersData }, { data: myAvailabilityData }, { data: myMatchedData }] = await Promise.all([
    supabase.from('service_requests').select('*').eq('status', 'open').is('target_photographer_id', null).order('date', { ascending: true }),
    supabase.from('service_requests').select('*').eq('status', 'open').eq('target_photographer_id', user.id).order('date', { ascending: true }),
    supabase.from('service_offers').select('*').eq('photographer_user_id', user.id),
    supabase.from('photographer_availability').select('*').eq('photographer_user_id', user.id).gte('date', today).order('date', { ascending: true }),
    supabase.from('service_requests').select('*').eq('status', 'matched').eq('matched_photographer_id', user.id).order('date', { ascending: true }),
  ]);
  let openRequests = (openRequestsData ?? []) as ServiceRequest[];
  if (locationFilter) {
    openRequests = openRequests.filter((r) => r.location.toLowerCase().includes(locationFilter.toLowerCase()));
  }
  const targetedRequests = (targetedRequestsData ?? []) as ServiceRequest[];
  const myOffers = (myOffersData ?? []) as ServiceOffer[];
  const offeredRequestIds = new Set(myOffers.map((o) => o.request_id));
  const myMatchedRequests = (myMatchedData ?? []) as ServiceRequest[];
  const myAvailability = (myAvailabilityData ?? []) as PhotographerAvailability[];

  const allRequests = [...targetedRequests, ...openRequests, ...myMatchedRequests];
  const djIds = Array.from(new Set(allRequests.map((r) => r.dj_user_id)));
  const gigIds = allRequests.map((r) => r.gig_id).filter((id): id is string => !!id);
  const [{ data: djProfiles }, { data: linkedGigsData }] = await Promise.all([
    djIds.length > 0 ? supabase.from('profiles').select('id, display_name').in('id', djIds) : Promise.resolve({ data: [] }),
    gigIds.length > 0 ? supabase.from('gigs').select('*').in('id', gigIds) : Promise.resolve({ data: [] }),
  ]);
  const djNameById = new Map((djProfiles ?? []).map((p) => [p.id, p.display_name ?? 'DJ']));
  const gigById = new Map(((linkedGigsData ?? []) as Gig[]).map((g) => [g.id, g]));

  function RequestCard({ request }: { request: ServiceRequest }) {
    const alreadyOffered = offeredRequestIds.has(request.id);
    const linkedGig = request.gig_id ? gigById.get(request.gig_id) : null;
    return (
      <div className="panel" style={{ marginBottom: 10 }} key={request.id}>
        <div className="row">
          <div>
            <strong>{request.location}</strong>
            <p className="meta">{formatDayMonth(request.date)} · {SERVICE_LABEL[request.service_type]} · <Link href={`/profile/${request.dj_user_id}`} className="profile-link">{djNameById.get(request.dj_user_id)}</Link></p>
          </div>
        </div>
        {linkedGig?.set_start && (
          <p className="meta">SET: {linkedGig.set_start.slice(0, 5)}–{linkedGig.set_end?.slice(0, 5) ?? '?'} · {linkedGig.venue}</p>
        )}
        {request.notes && <p className="meta">{request.notes}</p>}
        {alreadyOffered ? (
          <p className="empty-state">Angebot gesendet.</p>
        ) : (
          <form action={createOffer.bind(null, request.id)} className="inline-form">
            <input className="field" name="message" placeholder="Kurze Nachricht (optional)" />
            <button type="submit" className="button">ANBIETEN</button>
          </form>
        )}
      </div>
    );
  }

  return (
    <Screen title="FOTOGRAF / VIDEOGRAF" back="/">
      {targetedRequests.length > 0 && (
        <div>
          <div className="row section-heading"><span className="label">AN MICH GERICHTET</span><span className="muted">{targetedRequests.length}</span></div>
          {targetedRequests.map((request) => <RequestCard request={request} key={request.id} />)}
        </div>
      )}

      {myMatchedRequests.length > 0 && (
        <div>
          <div className="row section-heading"><span className="label">BESTÄTIGTE AUFTRÄGE</span><span className="muted">{myMatchedRequests.length}</span></div>
          {myMatchedRequests.map((request) => (
            <div className="panel" style={{ marginBottom: 10 }} key={request.id}>
              <div className="row">
                <div>
                  <strong>{request.location}</strong>
                  <p className="meta">{formatDayMonth(request.date)} · {SERVICE_LABEL[request.service_type]} · <Link href={`/profile/${request.dj_user_id}`} className="profile-link">{djNameById.get(request.dj_user_id)}</Link></p>
                </div>
              </div>
              <Link href={`/marketplace/chat/${request.id}`} className="edit-link">CHAT ÖFFNEN</Link>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="row section-heading"><span className="label">OFFENE ANFRAGEN</span><span className="muted">{openRequests.length}</span></div>
        <form className="quick-add" style={{ marginBottom: 10 }}>
          <input className="field" name="location" placeholder="Nach Standort filtern …" defaultValue={locationFilter} />
          <button type="submit" className="button">⌕</button>
        </form>
        {openRequests.length === 0 ? (
          <p className="empty-state">Aktuell keine offenen Anfragen.</p>
        ) : (
          openRequests.map((request) => <RequestCard request={request} key={request.id} />)
        )}
      </div>

      <div>
        <div className="row section-heading"><span className="label">MEINE VERFÜGBARKEIT</span><span className="muted">{myAvailability.length}</span></div>
        {myAvailability.length === 0 ? (
          <p className="empty-state">Noch keine Verfügbarkeit eingetragen.</p>
        ) : (
          myAvailability.map((slot) => (
            <div className="platform-row" key={slot.id}>
              <div className="platform-row-top">
                <span className="platform-name">{formatDayMonth(slot.date)} · {slot.start_time}–{slot.end_time}</span>
              </div>
              <p className="meta">{slot.location}</p>
              <form action={deleteAvailability.bind(null, slot.id)}>
                <button type="submit" className="edit-link">ENTFERNEN</button>
              </form>
            </div>
          ))
        )}
        <form action={createAvailability} className="auth-form">
          <div className="form-row">
            <div className="form-field">
              <span className="label">DATUM</span>
              <input className="field" type="date" name="date" required />
            </div>
            <div className="form-field">
              <span className="label">STANDORT</span>
              <input className="field" name="location" placeholder="z.B. Köln" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <span className="label">VON</span>
              <input className="field" type="time" name="start_time" required />
            </div>
            <div className="form-field">
              <span className="label">BIS</span>
              <input className="field" type="time" name="end_time" required />
            </div>
          </div>
          <button type="submit" className="button solid-button">VERFÜGBARKEIT HINZUFÜGEN</button>
        </form>
      </div>

      <Link href="/settings" className="claude-link">SKILLS & REFERENZEN BEARBEITEN <span>›</span></Link>
    </Screen>
  );
}
