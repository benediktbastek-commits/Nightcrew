import Link from 'next/link';
import { Screen } from '@/components/screen';
import { PostCard } from '@/components/post-card';
import { dateParts, daysBetween, formatCompact, formatCountdown, formatDayMonth, formatDueLabel, formatEuro, formatTimeRange, windowBucket } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';
import { hasRole, isPhotographerOnly } from '@/lib/roles';
import type { AccountMetric, Gig, Post, Profile, Release, ReleaseAsset, ReleaseDeadline, ReleaseKind, Task } from '@/lib/types';
import { toggleAsset, toggleDeadline, togglePhaseTask } from './releases/actions';
import { createTask, toggleTask } from './actions';
import { PhotographerDashboard } from './photographer-dashboard';

const KIND_LABEL: Record<ReleaseKind, string> = { ep: 'EP', single: 'SINGLE', album: 'ALBUM', remix: 'REMIX' };

export default async function OverviewPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const { data: profileData } = authUser
    ? await supabase.from('profiles').select('roles').eq('id', authUser.id).maybeSingle()
    : { data: null };
  const roles = (profileData?.roles ?? []) as Profile['roles'];

  if (authUser && isPhotographerOnly(roles)) {
    return <PhotographerDashboard userId={authUser.id} />;
  }

  const today = new Date().toISOString().slice(0, 10);
  const year = new Date().getFullYear();

  const in48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [
    { data: tasksData, error: tasksError },
    { data: nextGigData },
    { count: gigsQ4Count, error: gigsQ4Error },
    { count: postsOpenCount, error: postsOpenError },
    { data: dueSoonData, error: dueSoonError },
    { data: releasesData, error: releasesError },
    { data: openInvoicesData },
    { count: contactsCount },
    { count: contactsRecentCount },
    { data: accountMetricsData },
    { count: pendingConnectionsCount },
  ] = await Promise.all([
    supabase
      .from('tasks')
      .select('*')
      .eq('scope', 'general')
      .order('done', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('due_date', { ascending: true }),
    supabase.from('gigs').select('*').gte('date', today).order('date', { ascending: true }).limit(1).maybeSingle(),
    supabase.from('gigs').select('*', { count: 'exact', head: true }).gte('date', `${year}-10-01`).lte('date', `${year}-12-31`),
    supabase.from('posts').select('*', { count: 'exact', head: true }).neq('status', 'published'),
    supabase
      .from('posts')
      .select('*')
      .not('planned_at', 'is', null)
      .not('status', 'in', '(ready,published)')
      .lte('planned_at', in48h)
      .order('planned_at', { ascending: true }),
    supabase.from('releases').select('*').order('release_date', { ascending: true }),
    supabase.from('invoices').select('amount_cents').in('status', ['open', 'overdue']),
    supabase.from('contacts').select('*', { count: 'exact', head: true }),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).gte('last_contact_at', last30Days),
    supabase.from('account_metrics').select('platform, period_start, period_end, views'),
    authUser ? supabase.from('connections').select('*', { count: 'exact', head: true }).eq('recipient_id', authUser.id).eq('status', 'pending') : Promise.resolve({ count: 0 }),
  ]);
  if (tasksError) console.error('[OverviewPage] tasks', tasksError);
  if (gigsQ4Error) console.error('[OverviewPage] gigsQ4', gigsQ4Error);
  if (postsOpenError) console.error('[OverviewPage] postsOpen', postsOpenError);
  if (dueSoonError) console.error('[OverviewPage] dueSoon', dueSoonError);
  if (releasesError) console.error('[OverviewPage] releases', releasesError);
  const tasks = (tasksData ?? []) as Task[];
  const openCount = tasks.filter((task) => !task.done).length;
  const nextGig = nextGigData as Gig | null;
  const daysUntilGig = nextGig ? Math.round((new Date(`${nextGig.date}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86400000) : null;
  const dueSoonPosts = (dueSoonData ?? []) as Post[];

  // Gleiche "30 Tage"-Fensterlogik wie im Analytics-Tab: pro Plattform nur der
  // Screenshot, dessen Zeitraum zu 30 Tagen passt, keine Vermischung mit 7/90-Tage-Werten.
  const accountMetrics = (accountMetricsData ?? []) as Pick<AccountMetric, 'platform' | 'period_start' | 'period_end' | 'views'>[];
  const reachPlatforms = Array.from(new Set(accountMetrics.map((m) => m.platform)));
  const totalReach = reachPlatforms.reduce((sum, platform) => {
    const candidates = accountMetrics.filter((m) => m.platform === platform && windowBucket(m.period_start, m.period_end) === 30);
    const latest = candidates.sort((a, b) => b.period_end.localeCompare(a.period_end))[0];
    return sum + (latest?.views ?? 0);
  }, 0);

  const releases = (releasesData ?? []) as Release[];
  const currentRelease = releases.find((release) => release.release_date >= today && release.status !== 'released') ?? null;
  let releaseTrackCount = 0;
  let releaseTasksDone = 0;
  let releaseTasksTotal = 0;
  let openReleaseTasks: Task[] = [];
  let openReleaseAssets: ReleaseAsset[] = [];
  let openReleaseDeadlines: ReleaseDeadline[] = [];
  if (currentRelease) {
    const [{ count: trackCount }, { data: releaseTasksData }, { data: openAssetsData }, { data: openDeadlinesData }] = await Promise.all([
      supabase.from('tracks').select('*', { count: 'exact', head: true }).eq('release_id', currentRelease.id),
      supabase.from('tasks').select('*').eq('release_id', currentRelease.id),
      supabase.from('release_assets').select('*').eq('release_id', currentRelease.id).eq('done', false),
      supabase.from('release_deadlines').select('*').eq('release_id', currentRelease.id).eq('done', false).order('due_date', { ascending: true }),
    ]);
    releaseTrackCount = trackCount ?? 0;
    const releaseTasks = (releaseTasksData ?? []) as Task[];
    releaseTasksTotal = releaseTasks.length;
    releaseTasksDone = releaseTasks.filter((task) => task.done).length;
    openReleaseTasks = releaseTasks.filter((task) => !task.done);
    openReleaseAssets = (openAssetsData ?? []) as ReleaseAsset[];
    openReleaseDeadlines = (openDeadlinesData ?? []) as ReleaseDeadline[];
  }
  const daysUntilRelease = currentRelease ? daysBetween(today, currentRelease.release_date) : null;
  const releaseOpenCount = openReleaseTasks.length + openReleaseAssets.length + openReleaseDeadlines.length;
  const openInvoicesTotal = ((openInvoicesData ?? []) as { amount_cents: number }[]).reduce((sum, row) => sum + row.amount_cents, 0);

  return (
    <Screen title="ÜBERBLICK">
      <section className="hero-panel">
        <div className="row"><span className="label bright">NÄCHSTER GIG</span><span className="muted">{nextGig && daysUntilGig !== null ? formatCountdown(daysUntilGig) : ''}</span></div>
        {nextGig ? (
          <div>
            <h2>{nextGig.venue}</h2>
            <p className="muted">{nextGig.city} / {dateParts(nextGig.date).weekday} {dateParts(nextGig.date).day}.{dateParts(nextGig.date).month} / {formatTimeRange(nextGig.set_start, nextGig.set_end)}</p>
          </div>
        ) : (
          <p className="muted">Kein Gig geplant.</p>
        )}
        <div className="button-row">
          <button className="button solid-button" disabled={!nextGig}>RIDER SENDEN</button>
          <Link href="/tour" className="button">LOGISTIK</Link>
        </div>
      </section>
      <section className="metrics">
        <div className="metric"><span className="label">GIGS Q4</span><strong>{String(gigsQ4Count ?? 0).padStart(2, '0')}</strong></div>
        <div className="metric"><span className="label">AUFRUFE 30T</span><strong>{totalReach > 0 ? formatCompact(totalReach) : '—'}</strong></div>
        <div className="metric"><span className="label">POSTS OFFEN</span><strong>{String(postsOpenCount ?? 0).padStart(2, '0')}</strong></div>
      </section>
      <section>
        <div className="row section-heading"><span className="label">RELEASE</span><span className="muted">{currentRelease && daysUntilRelease !== null ? formatCountdown(daysUntilRelease) : ''}</span></div>
        {currentRelease ? (
          <Link href={`/releases/${currentRelease.id}`} className="panel release-card">
            <div className="row"><div><h3>{KIND_LABEL[currentRelease.kind]} „{currentRelease.title}“</h3><p className="meta">VÖ {formatDayMonth(currentRelease.release_date)} · {releaseTrackCount} TRACKS</p></div><div className="cover" /></div>
            {releaseTasksTotal > 0 && (
              <>
                <div className="segments">{Array.from({ length: releaseTasksTotal }, (_, i) => <i className={i < releaseTasksDone ? 'filled' : ''} key={i} />)}</div>
                <p className="meta">{releaseTasksDone} / {releaseTasksTotal} AUFGABEN</p>
              </>
            )}
          </Link>
        ) : (
          <Link href="/releases/new" className="panel release-card"><p className="muted">Kein Release geplant.</p></Link>
        )}
      </section>
      {currentRelease && (
        <section>
          <div className="row section-heading"><span className="label">OFFEN FÜR RELEASE</span><span className="muted">{releaseOpenCount}</span></div>
          {releaseOpenCount === 0 ? (
            <p className="empty-state">Alles erledigt.</p>
          ) : (
            <>
              {openReleaseTasks.map((task) => (
                <form action={togglePhaseTask.bind(null, task.id, currentRelease.id, task.done)} key={`task-${task.id}`}>
                  <button type="submit" className="task">
                    <span className="checkbox" />
                    <span>{task.title}</span>
                    <span className="due">{formatDueLabel(task.due_date)}</span>
                  </button>
                </form>
              ))}
              {openReleaseAssets.map((asset) => (
                <form action={toggleAsset.bind(null, asset.id, currentRelease.id, asset.done)} key={`asset-${asset.id}`}>
                  <button type="submit" className="asset-row" style={{ width: '100%', border: 0, borderTop: '1px solid rgba(230,230,230,.08)', background: 'transparent', textAlign: 'left', cursor: 'pointer', color: 'inherit', font: 'inherit' }}>
                    <span className="asset-marker">·</span>
                    <span className="grow">{asset.name}</span>
                    <span className="muted">FEHLT</span>
                  </button>
                </form>
              ))}
              {openReleaseDeadlines.map((deadline) => (
                <form action={toggleDeadline.bind(null, deadline.id, currentRelease.id, deadline.done)} key={`deadline-${deadline.id}`}>
                  <button type="submit" className="deadline-row" style={{ width: '100%', border: 0, borderTop: '1px solid rgba(230,230,230,.08)', background: 'transparent', textAlign: 'left', cursor: 'pointer', color: 'inherit', font: 'inherit' }}>
                    <span className="deadline-date">{deadline.due_date.slice(8, 10)}.{deadline.due_date.slice(5, 7)}</span>
                    <span className="grow">{deadline.title}</span>
                    <span className="muted">{deadline.due_date <= today ? 'FÄLLIG' : 'OFFEN'}</span>
                  </button>
                </form>
              ))}
            </>
          )}
        </section>
      )}
      <section className="panel">
        <div className="row section-heading"><span className="label">OFFENE AUFGABEN</span><span className="muted">{openCount} / {tasks.length}</span></div>
        {tasks.length === 0 ? (
          <p className="empty-state">Keine Aufgaben.</p>
        ) : (
          tasks.map((task) => (
            <form action={toggleTask.bind(null, task.id, task.done)} key={task.id}>
              <button type="submit" className="task">
                <span className={`checkbox ${task.done ? 'checked' : ''}`}>{task.done ? '✓' : ''}</span>
                <span className={task.done ? 'completed' : ''}>{task.title}</span>
                <span className="due">{formatDueLabel(task.due_date)}</span>
              </button>
            </form>
          ))
        )}
        <form action={createTask} className="quick-add">
          <input className="field" name="title" placeholder="Neue Aufgabe …" required />
          <button type="submit" className="button">+</button>
        </form>
      </section>
      <section>
        <div className="row section-heading"><span className="label">BALD FÄLLIG</span><span className="muted">{dueSoonPosts.length}</span></div>
        {dueSoonPosts.length === 0 ? (
          <p className="empty-state">Nichts Dringendes.</p>
        ) : (
          dueSoonPosts.map((post) => <PostCard post={post} key={post.id} />)
        )}
      </section>
      <section className="module-grid">
        <Link href="/finance" className="module"><span className="label">FINANZEN</span><strong>{formatEuro(openInvoicesTotal)}</strong><span className="muted">OFFEN</span></Link>
        <Link href="/contacts" className="module"><span className="label">KONTAKTE</span><strong>{contactsCount ?? 0}</strong><span className="muted">{contactsRecentCount ?? 0} LETZTE 30 T</span></Link>
        <Link href="/tour" className="module"><span className="label">TOUR</span><strong>{nextGig ? nextGig.city.toUpperCase() : '—'}</strong><span className="muted">{nextGig ? formatDayMonth(nextGig.date) : 'KEIN GIG'}</span></Link>
        <Link href="/marketplace" className="module"><span className="label">FOTOGRAF / VIDEOGRAF</span><strong>SUCHEN</strong><span className="muted">Marktplatz</span></Link>
        <Link href="/network" className="module"><span className="label">NETZWERK</span><strong>{pendingConnectionsCount ?? 0}</strong><span className="muted">NEUE ANFRAGEN</span></Link>
        <Link href="/import" className="module wide"><span>＋ SCREENSHOT IMPORTIEREN</span><span>›</span></Link>
      </section>
      <Link href="/claude" className="claude-link"><span className="pulse" /> MIT CLAUDE CONTENT PLANEN <span>›</span></Link>
    </Screen>
  );
}
