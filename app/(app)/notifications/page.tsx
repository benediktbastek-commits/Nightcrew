import { Screen } from '@/components/screen';
import { createClient } from '@/lib/supabase/server';
import { markAllRead, markRead } from './actions';
import type { Notification } from '@/lib/types';

function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'JETZT';
  if (minutes < 60) return `VOR ${minutes} MIN`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `VOR ${hours} STD`;
  return `VOR ${Math.round(hours / 24)} T`;
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  if (error) console.error('[NotificationsPage]', error);
  const notifications = (data ?? []) as Notification[];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Screen title="BENACHRICHTIGUNGEN" back="/">
      <div className="row list-meta">
        <span className="label">{notifications.length} GESAMT</span>
        {unreadCount > 0 && (
          <form action={markAllRead}>
            <button type="submit" className="edit-link">ALLE ALS GELESEN MARKIEREN</button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="empty-state">Noch keine Benachrichtigungen.</p>
      ) : (
        notifications.map((notification) => (
          <form action={markRead.bind(null, notification.id, notification.link)} key={notification.id}>
            <button type="submit" className={`notification-row${notification.read ? '' : ' unread'}`} style={{ width: '100%', border: 0, textAlign: 'left', cursor: 'pointer', color: 'inherit', font: 'inherit' }}>
              <span>{notification.message}</span>
              <span className="muted">{timeAgo(notification.created_at)}</span>
            </button>
          </form>
        ))
      )}
    </Screen>
  );
}
