import Link from 'next/link';
import { Screen } from '@/components/screen';
import { createClient } from '@/lib/supabase/server';
import { ReleaseView } from './release-view';
import type { Release } from '@/lib/types';

export default async function ReleasesPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase.from('releases').select('*').order('release_date', { ascending: true });
  if (error) console.error('[ReleasesPage] releases', error);
  const releases = (data ?? []) as Release[];

  if (releases.length === 0) {
    return (
      <Screen title="RELEASES">
        <p className="empty-state">Noch keine Releases.</p>
        <Link href="/releases/new" className="claude-link">+ NEUES RELEASE ANLEGEN <span>›</span></Link>
      </Screen>
    );
  }

  const current = releases.find((release) => release.release_date >= today && release.status !== 'released') ?? releases[releases.length - 1];

  return (
    <Screen title="RELEASES">
      <ReleaseView releaseId={current.id} />
    </Screen>
  );
}
