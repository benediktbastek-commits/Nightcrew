import Link from 'next/link';
import { Screen } from '@/components/screen';
import { createClient } from '@/lib/supabase/server';
import { dateParts, formatDayMonth } from '@/lib/format';
import { createItineraryStop, createRiderItem, toggleItineraryStop, toggleRiderItem } from './actions';
import type { Gig, ItineraryStop, Task } from '@/lib/types';

export default async function TourPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: nextGigData, error: gigError } = await supabase
    .from('gigs')
    .select('*')
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (gigError) console.error('[TourPage] gig', gigError);
  const gig = nextGigData as Gig | null;

  if (!gig) {
    return (
      <Screen title="TOUR & LOGISTIK" back="/">
        <p className="empty-state">Keine kommende Reise geplant.</p>
        <Link href="/bookings/new" className="claude-link">+ GIG ANLEGEN <span>›</span></Link>
      </Screen>
    );
  }

  const [{ data: stopsData }, { data: riderData }] = await Promise.all([
    supabase.from('itinerary_stops').select('*').eq('gig_id', gig.id).order('sort_order', { ascending: true }),
    supabase.from('tasks').select('*').eq('scope', 'gig').eq('gig_id', gig.id).order('sort_order', { ascending: true }),
  ]);
  const stops = (stopsData ?? []) as ItineraryStop[];
  const riderItems = (riderData ?? []) as Task[];
  const { weekday, day, month } = dateParts(gig.date);

  return (
    <Screen title="TOUR & LOGISTIK" back="/">
      <section className="hero-panel">
        <span className="label bright">NÄCHSTE REISE</span>
        <div>
          <h2>{gig.city.toUpperCase()} · {formatDayMonth(gig.date)}</h2>
          <p className="muted">{gig.venue} / {weekday} {day}.{month}</p>
        </div>
      </section>

      <div>
        <div className="row section-heading"><span className="label">ABLAUF</span></div>
        {stops.length === 0 ? (
          <p className="empty-state">Noch kein Ablauf geplant.</p>
        ) : (
          stops.map((stop) => (
            <form action={toggleItineraryStop.bind(null, stop.id, stop.done)} key={stop.id}>
              <button type="submit" className="itinerary-row" style={{ width: '100%', border: 0, background: 'transparent', textAlign: 'left', cursor: 'pointer', color: 'inherit', font: 'inherit' }}>
                <span className="itinerary-time">{stop.time}</span>
                <div className="itinerary-track"><span className={`itinerary-dot${stop.done ? ' done' : ''}`} /></div>
                <div className="itinerary-content">
                  <strong className={stop.done ? 'completed' : ''}>{stop.title}</strong>
                  {stop.detail && <span>{stop.detail}</span>}
                </div>
              </button>
            </form>
          ))
        )}
        <form action={createItineraryStop.bind(null, gig.id)} className="itinerary-add">
          <input className="field itinerary-add-time" name="time" placeholder="14:00" required />
          <input className="field" name="title" placeholder="z.B. Abfahrt" required />
          <button type="submit" className="button">+</button>
        </form>
      </div>

      <section className="panel">
        <div className="row section-heading"><span className="label">RIDER-CHECK</span></div>
        {riderItems.length === 0 ? (
          <p className="empty-state">Noch keine Rider-Punkte.</p>
        ) : (
          riderItems.map((item) => (
            <form action={toggleRiderItem.bind(null, item.id, item.done)} key={item.id}>
              <button type="submit" className="task">
                <span className={`checkbox ${item.done ? 'checked' : ''}`}>{item.done ? '✓' : ''}</span>
                <span className={item.done ? 'completed' : ''}>{item.title}</span>
              </button>
            </form>
          ))
        )}
        <form action={createRiderItem.bind(null, gig.id)} className="quick-add">
          <input className="field" name="title" placeholder="z.B. Equipment bestätigt" required />
          <button type="submit" className="button">+</button>
        </form>
      </section>

      <Link href={`/bookings/${gig.id}/edit`} className="claude-link">GIG-DETAILS BEARBEITEN <span>›</span></Link>
    </Screen>
  );
}
