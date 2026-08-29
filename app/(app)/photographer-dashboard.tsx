import Link from 'next/link';
import { Screen } from '@/components/screen';
import { createClient } from '@/lib/supabase/server';
import { formatDayMonth } from '@/lib/format';
import type { Gig, ServiceRequest } from '@/lib/types';

export async function PhotographerDashboard({ userId }: { userId: string }) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: nextGigData }, { count: openRequestsCount }, { count: pendingConnectionsCount }] = await Promise.all([
    supabase.from('gigs').select('*').eq('user_id', userId).gte('date', today).order('date', { ascending: true }).limit(1).maybeSingle(),
    supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('connections').select('*', { count: 'exact', head: true }).eq('recipient_id', userId).eq('status', 'pending'),
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
        <Link href="/network" className="module"><span className="label">NETZWERK</span><strong>{pendingConnectionsCount ?? 0}</strong><span className="muted">NEUE ANFRAGEN</span></Link>
        <Link href="/settings" className="module"><span className="label">SKILLS</span><strong>BEARBEITEN</strong><span className="muted">& Referenzen</span></Link>
      </section>
    </Screen>
  );
}
