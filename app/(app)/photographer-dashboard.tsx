import Link from 'next/link';
import { Screen } from '@/components/screen';
import { createClient } from '@/lib/supabase/server';
import { formatDayMonth } from '@/lib/format';
import type { Gig, ServiceRequest } from '@/lib/types';

export async function PhotographerDashboard({ userId }: { userId: string }) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: nextGigData }, { count: openRequestsCount }] = await Promise.all([
    supabase.from('gigs').select('*').eq('user_id', userId).gte('date', today).order('date', { ascending: true }).limit(1).maybeSingle(),
    supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ]);
  const nextGig = nextGigData as Gig | null;

  return (
    <Screen title="ÜBERBLICK">
      <section className="hero-panel">
        <span className="label bright">NÄCHSTER AUFTRAG</span>
        {nextGig ? (
          <div>
            <h2>{nextGig.venue}</h2>
            <p className="muted">{nextGig.city} / {formatDayMonth(nextGig.date)}</p>
          </div>
        ) : (
          <p className="muted">Kein Auftrag geplant.</p>
        )}
        <div className="button-row">
          <Link href="/bookings" className="button">MEINE AUFTRÄGE</Link>
        </div>
      </section>

      <Link href="/marketplace" className="claude-link">
        <span>OFFENE ANFRAGEN ANSEHEN</span>
        <span className="muted" style={{ marginRight: 8 }}>{openRequestsCount ?? 0}</span>
        <span>›</span>
      </Link>

      <section className="module-grid">
        <Link href="/settings" className="module wide"><span>SKILLS & REFERENZEN BEARBEITEN</span><span>›</span></Link>
      </section>
    </Screen>
  );
}
