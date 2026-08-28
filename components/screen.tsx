import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { dateParts } from '@/lib/format';

async function Header({ title, back }: { title: string; back?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from('profiles').select('display_name, avatar_url').eq('id', user.id).maybeSingle() : { data: null };
  const { count: unreadCount } = user
    ? await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false)
    : { count: 0 };

  const today = new Date().toISOString().slice(0, 10);
  const { weekday, day, month } = dateParts(today);
  const initials = (profile?.display_name ?? '').trim().split(/\s+/).map((part: string) => part[0]).slice(0, 2).join('').toUpperCase() || '·';

  return (
    <header className="header">
      {back && <Link href={back} className="back-button">←</Link>}
      <div>
        <p className="eyebrow">{weekday} · {day} {month} {new Date().getFullYear()}</p>
        <h1>{title}</h1>
      </div>
      <Link href="/notifications" className="bell" title="Benachrichtigungen">
        N
        {!!unreadCount && <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </Link>
      <Link
        href="/settings"
        className="avatar"
        title="Einstellungen"
        style={profile?.avatar_url ? { backgroundImage: `url(${profile.avatar_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        {!profile?.avatar_url && initials}
      </Link>
    </header>
  );
}

export function Screen({ title, back, children }: { title: string; back?: string; children: React.ReactNode }) {
  return (
    <>
      <Header title={title} back={back} />
      <main className="content">{children}</main>
    </>
  );
}
