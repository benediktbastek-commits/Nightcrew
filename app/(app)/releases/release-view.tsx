import Link from 'next/link';
import { Chip } from '@/components/ui';
import { PostCard } from '@/components/post-card';
import { createClient } from '@/lib/supabase/server';
import { daysBetween, formatDateLong, formatDueLabel, formatEuro } from '@/lib/format';
import type { Post, Release, ReleaseAsset, ReleaseDeadline, ReleaseKind, ReleasePhase, ReleaseStatus, Task, Track, TrackStatus } from '@/lib/types';
import {
  createAsset,
  createDeadline,
  createPhase,
  createPhaseTask,
  createTrack,
  cycleTrackStatus,
  toggleAsset,
  toggleDeadline,
  togglePhaseTask,
} from './actions';

const KIND_LABEL: Record<ReleaseKind, string> = { ep: 'EP', single: 'SINGLE', album: 'ALBUM', remix: 'REMIX' };
const RELEASE_STATUS_LABEL: Record<ReleaseStatus, string> = { planning: 'IN PLANUNG', scheduled: 'GEPLANT', released: 'ERSCHIENEN' };
const RELEASE_STATUS_TONE: Record<ReleaseStatus, 'solid' | 'outline' | 'dim'> = { planning: 'outline', scheduled: 'outline', released: 'dim' };
const TRACK_STATUS_LABEL: Record<TrackStatus, string> = { master: 'MASTER', revision: 'REVISION', open: 'OFFEN' };
const TRACK_STATUS_TONE: Record<TrackStatus, 'solid' | 'outline' | 'dim'> = { master: 'solid', revision: 'outline', open: 'dim' };

export async function ReleaseView({ releaseId }: { releaseId: string }) {
  const supabase = await createClient();
  const [
    { data: releaseData },
    { data: othersData },
    { data: phasesData },
    { data: tracksData },
    { data: assetsData },
    { data: deadlinesData },
    { data: tasksData },
    { data: postsData },
  ] = await Promise.all([
    supabase.from('releases').select('*').eq('id', releaseId).single(),
    supabase.from('releases').select('*').neq('id', releaseId).order('release_date', { ascending: true }),
    supabase.from('release_phases').select('*').eq('release_id', releaseId).order('sort_order', { ascending: true }),
    supabase.from('tracks').select('*').eq('release_id', releaseId).order('sort_order', { ascending: true }),
    supabase.from('release_assets').select('*').eq('release_id', releaseId).order('id', { ascending: true }),
    supabase.from('release_deadlines').select('*').eq('release_id', releaseId).order('due_date', { ascending: true }),
    supabase.from('tasks').select('*').eq('release_id', releaseId).order('sort_order', { ascending: true }),
    supabase.from('posts').select('*').eq('release_id', releaseId).order('planned_at', { ascending: true }),
  ]);

  if (!releaseData) return <p className="empty-state">Release nicht gefunden.</p>;

  const release = releaseData as Release;
  const others = (othersData ?? []) as Release[];
  const phases = (phasesData ?? []) as ReleasePhase[];
  const tracks = (tracksData ?? []) as Track[];
  const assets = (assetsData ?? []) as ReleaseAsset[];
  const deadlines = (deadlinesData ?? []) as ReleaseDeadline[];
  const tasks = (tasksData ?? []) as Task[];
  const posts = (postsData ?? []) as Post[];

  const today = new Date().toISOString().slice(0, 10);
  const daysLeft = daysBetween(today, release.release_date);
  const totalSpan = Math.max(daysBetween(release.campaign_start, release.release_date), 1);
  const todayPct = Math.min(100, Math.max(0, (daysBetween(release.campaign_start, today) / totalSpan) * 100));

  const tracksMaster = tracks.filter((t) => t.status === 'master').length;
  const tasksDone = tasks.filter((t) => t.done).length;
  const assetsDone = assets.filter((a) => a.done).length;

  return (
    <>
      <section className="hero-panel release-hero">
        <div className="row">
          <div>
            <span className="label bright">{release.status === 'released' ? 'RELEASE' : 'AKTUELLER RELEASE'}</span>
            <h2>{KIND_LABEL[release.kind]} „{release.title}“</h2>
            <p className="meta">{KIND_LABEL[release.kind]} · {tracks.length} TRACKS{release.label ? ` · ${release.label.toUpperCase()}` : ''}</p>
          </div>
          <div className="countdown"><strong>{Math.abs(daysLeft)}</strong><span>{daysLeft >= 0 ? 'TAGE' : 'TAGE HER'}</span></div>
        </div>
        <div className="release-meta">
          <div className="metric"><span className="label">VERÖFFENTLICHUNG</span><strong>{formatDateLong(release.release_date)}</strong></div>
          <div className="metric"><span className="label">STATUS</span><strong>{RELEASE_STATUS_LABEL[release.status]}</strong></div>
        </div>
      </section>
      <Link href={`/releases/${release.id}/edit`} className="edit-link">BEARBEITEN</Link>

      {phases.length > 0 && (
        <div>
          <div className="row section-heading"><span className="label">ZEITSTRAHL</span><span className="muted">{formatDateLong(release.campaign_start).slice(3)} → {formatDateLong(release.release_date).slice(3)}</span></div>
          <div className="timeline">
            <div className="phase-bars" style={{ gridTemplateColumns: phases.map((p) => `${Math.max(daysBetween(p.starts_on, p.ends_on), 1)}fr`).join(' ') }}>
              {phases.map((phase) => {
                const state = phase.ends_on < today ? 'done' : phase.starts_on <= today && today <= phase.ends_on ? 'current' : '';
                return <i className={state} key={phase.id}>{phase.no}</i>;
              })}
            </div>
            <div className="today-marker" style={{ left: `${todayPct}%` }}><span>HEUTE</span></div>
            <div className="phase-labels" style={{ gridTemplateColumns: phases.map((p) => `${Math.max(daysBetween(p.starts_on, p.ends_on), 1)}fr`).join(' ') }}>
              {phases.map((phase) => <span key={phase.id}>{phase.name.toUpperCase()}</span>)}
            </div>
          </div>
        </div>
      )}

      <section className="metrics release-stats">
        <div className="metric"><span className="label">PRE-SAVES</span><strong>{release.presave_count}</strong><span className="meta">ZIEL {release.presave_goal}</span></div>
        <div className="metric"><span className="label">TRACKS MASTER</span><strong>{tracksMaster} / {tracks.length}</strong></div>
        <div className="metric"><span className="label">AUFGABEN</span><strong>{tasksDone} / {tasks.length}</strong></div>
        <div className="metric"><span className="label">BUDGET</span><strong>{formatEuro(release.budget_cents)}</strong></div>
      </section>

      {phases.length === 0 ? (
        <p className="empty-state">Noch keine Phasen.</p>
      ) : (
        phases.map((phase) => {
          const phaseTasks = tasks.filter((t) => t.phase_id === phase.id);
          const done = phaseTasks.filter((t) => t.done).length;
          const state = phase.ends_on < today ? 'ERLEDIGT' : phase.starts_on <= today && today <= phase.ends_on ? 'LÄUFT' : 'GEPLANT';
          return (
            <section className="panel phase" key={phase.id}>
              <div className="row"><strong>{String(phase.no).padStart(2, '0')} · {phase.name.toUpperCase()}</strong><span className="muted">{done} / {phaseTasks.length} · {state}</span></div>
              {phaseTasks.map((task) => (
                <form action={togglePhaseTask.bind(null, task.id, release.id, task.done)} key={task.id}>
                  <button type="submit" className="task">
                    <span className={`checkbox ${task.done ? 'checked' : ''}`}>{task.done ? '✓' : ''}</span>
                    <span className={task.done ? 'completed' : ''}>{task.title}</span>
                    <span className="due">{formatDueLabel(task.due_date)}</span>
                  </button>
                </form>
              ))}
              <form action={createPhaseTask.bind(null, release.id, phase.id)} className="quick-add">
                <input className="field" name="title" placeholder="Neue Aufgabe …" required />
                <button type="submit" className="button">+</button>
              </form>
            </section>
          );
        })
      )}
      <form action={createPhase.bind(null, release.id)} className="track-add">
        <input className="field" name="name" placeholder="Phase, z.B. Promo" required />
        <input className="field deadline-add-date" type="date" name="starts_on" required />
        <input className="field deadline-add-date" type="date" name="ends_on" required />
        <button type="submit" className="button">+</button>
      </form>

      <div>
        <div className="row section-heading"><span className="label">TRACKS</span><span className="muted">{tracks.length}</span></div>
        {tracks.length === 0 ? (
          <p className="empty-state">Noch keine Tracks.</p>
        ) : (
          tracks.map((track) => (
            <form action={cycleTrackStatus.bind(null, track.id, release.id, track.status)} key={track.id}>
              <button type="submit" className="track-row" style={{ width: '100%', border: 0, background: 'transparent', textAlign: 'left', cursor: 'pointer', color: 'inherit', font: 'inherit' }}>
                <span className="track-side">{track.side_label}</span>
                <span className="grow">{track.title}</span>
                <Chip tone={TRACK_STATUS_TONE[track.status]}>{TRACK_STATUS_LABEL[track.status]}</Chip>
              </button>
            </form>
          ))
        )}
        <form action={createTrack.bind(null, release.id)} className="track-add">
          <input className="field track-add-side" name="side_label" placeholder="A1" />
          <input className="field" name="title" placeholder="Titel" required />
          <button type="submit" className="button">+</button>
        </form>
      </div>

      <div>
        <div className="row section-heading"><span className="label">ASSETS</span><span className="muted">{assetsDone} / {assets.length} FERTIG</span></div>
        {assets.length === 0 ? (
          <p className="empty-state">Noch keine Assets.</p>
        ) : (
          assets.map((asset) => (
            <form action={toggleAsset.bind(null, asset.id, release.id, asset.done)} key={asset.id}>
              <button type="submit" className="asset-row" style={{ width: '100%', border: 0, background: 'transparent', textAlign: 'left', cursor: 'pointer', color: 'inherit', font: 'inherit' }}>
                <span className={`asset-marker ${asset.done ? 'done' : ''}`}>{asset.done ? '✓' : '·'}</span>
                <span className="grow">{asset.name}</span>
                <span className="muted">{asset.done ? asset.done_on : 'FEHLT'}</span>
              </button>
            </form>
          ))
        )}
        <form action={createAsset.bind(null, release.id)} className="asset-add">
          <input className="field" name="name" placeholder="Asset, z.B. Cover" required />
          <button type="submit" className="button">+</button>
        </form>
      </div>

      <div>
        <div className="row section-heading"><span className="label">EXTERNE DEADLINES</span><span className="muted">{deadlines.length}</span></div>
        {deadlines.length === 0 ? (
          <p className="empty-state">Keine Deadlines.</p>
        ) : (
          deadlines.map((deadline) => (
            <form action={toggleDeadline.bind(null, deadline.id, release.id, deadline.done)} key={deadline.id}>
              <button type="submit" className="deadline-row" style={{ width: '100%', border: 0, background: 'transparent', textAlign: 'left', cursor: 'pointer', color: 'inherit', font: 'inherit' }}>
                <span className="deadline-date">{deadline.due_date.slice(8, 10)}.{deadline.due_date.slice(5, 7)}</span>
                <span className="grow">{deadline.title}</span>
                <Chip tone={deadline.done ? 'dim' : deadline.due_date <= today ? 'solid' : 'outline'}>{deadline.done ? 'ERLEDIGT' : deadline.due_date <= today ? 'FÄLLIG' : 'OFFEN'}</Chip>
              </button>
            </form>
          ))
        )}
        <form action={createDeadline.bind(null, release.id)} className="deadline-add">
          <input className="field" name="title" placeholder="Deadline, z.B. Playlist-Pitch" required />
          <input className="field deadline-add-date" type="date" name="due_date" required />
          <button type="submit" className="button">+</button>
        </form>
      </div>

      <div>
        <div className="row section-heading"><span className="label">CONTENT</span><span className="muted">{posts.length}</span></div>
        {posts.length === 0 ? (
          <p className="empty-state">Noch keine Posts für dieses Release.</p>
        ) : (
          posts.map((post) => <PostCard post={post} key={post.id} />)
        )}
        <Link href="/content/new" className="claude-link">+ POST ANLEGEN <span>›</span></Link>
      </div>

      {others.length > 0 && (
        <div>
          <div className="row section-heading"><span className="label">WEITERE RELEASES</span></div>
          {others.map((other) => (
            <Link href={`/releases/${other.id}`} className="other-release-row" key={other.id}>
              <div className="other-release-cover" />
              <div className="grow">
                <strong>{KIND_LABEL[other.kind]} „{other.title}“</strong>
                <span className="gig-row-time">{formatDateLong(other.release_date)}</span>
              </div>
              <Chip tone={RELEASE_STATUS_TONE[other.status]}>{RELEASE_STATUS_LABEL[other.status]}</Chip>
            </Link>
          ))}
        </div>
      )}

      <Link href="/releases/new" className="claude-link">+ NEUES RELEASE ANLEGEN <span>›</span></Link>
    </>
  );
}
