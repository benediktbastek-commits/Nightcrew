import Link from 'next/link';
import { Screen } from '@/components/screen';
import { PostCard } from '@/components/post-card';
import { createClient } from '@/lib/supabase/server';
import { dateKey } from '@/lib/format';
import type { Post } from '@/lib/types';

const WEEKDAY_LABELS = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'];

function Pipeline({ group, items }: { group: string; items: Post[] }) {
  return (
    <section>
      <div className="section-heading"><span className="label">{group} · {items.length}</span></div>
      {items.length === 0 ? (
        <p className="empty-state">Keine Posts.</p>
      ) : (
        items.map((post) => <PostCard post={post} key={post.id} />)
      )}
    </section>
  );
}

export default async function ContentPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('posts').select('*').order('planned_at', { ascending: true });
  if (error) console.error('[ContentPage] posts', error);
  const posts = (data ?? []) as Post[];

  const today = new Date();
  const todayKey = dateKey(today);
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
  const sundayKey = dateKey(weekDates[6]);

  const upcoming = posts.filter((post) => post.status !== 'published');
  const todayPosts = upcoming.filter((post) => post.planned_at && dateKey(new Date(post.planned_at)) === todayKey);
  const thisWeekPosts = upcoming.filter((post) => {
    if (!post.planned_at) return false;
    const key = dateKey(new Date(post.planned_at));
    return key > todayKey && key <= sundayKey;
  });
  const plannedPosts = upcoming.filter((post) => {
    if (!post.planned_at) return true;
    return dateKey(new Date(post.planned_at)) > sundayKey;
  });

  return (
    <Screen title="CONTENT">
      <div className="week">
        {weekDates.map((date, i) => {
          const key = dateKey(date);
          const markers = posts.filter((post) => post.planned_at && dateKey(new Date(post.planned_at)) === key).length;
          return (
            <div className={key === todayKey ? 'today' : ''} key={key}>
              <span>{WEEKDAY_LABELS[i]}</span>
              <b>{date.getDate()}</b>
              {Array.from({ length: Math.min(markers, 2) }, (_, m) => (
                <i className={m === 0 ? '' : 'outline'} key={m} />
              ))}
            </div>
          );
        })}
      </div>
      <Pipeline group="HEUTE" items={todayPosts} />
      <Pipeline group="DIESE WOCHE" items={thisWeekPosts} />
      <Pipeline group="GEPLANT" items={plannedPosts} />
      <Link href="/content/new" className="claude-link">+ POST ANLEGEN <span>›</span></Link>
    </Screen>
  );
}
