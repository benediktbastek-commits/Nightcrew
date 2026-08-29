import { notFound } from 'next/navigation';
import { Screen } from '@/components/screen';
import { createClient } from '@/lib/supabase/server';
import { sendDirectMessage } from '../../actions';
import type { Connection, DirectMessage } from '@/lib/types';

function formatTime(iso: string) {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default async function NetworkChatPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: connectionData } = await supabase.from('connections').select('*').eq('id', params.id).maybeSingle();
  const connection = connectionData as Connection | null;
  if (!connection || connection.status !== 'accepted' || (connection.requester_id !== user.id && connection.recipient_id !== user.id)) {
    notFound();
  }

  const otherUserId = connection.requester_id === user.id ? connection.recipient_id : connection.requester_id;
  const [{ data: messagesData }, { data: otherProfile }] = await Promise.all([
    supabase.from('direct_messages').select('*').eq('connection_id', params.id).order('created_at', { ascending: true }),
    supabase.from('profiles').select('display_name').eq('id', otherUserId).maybeSingle(),
  ]);
  const messages = (messagesData ?? []) as DirectMessage[];
  const otherName = otherProfile?.display_name ?? 'Kontakt';

  return (
    <Screen title={`CHAT · ${otherName.toUpperCase()}`} back="/network">
      <div className="chat-wrapper">
        <div className="chat">
          {messages.length === 0 && <div className="msg ai">Noch keine Nachrichten mit {otherName}.</div>}
          {messages.map((message) => (
            <div className={`msg ${message.sender_id === user.id ? 'me' : 'ai'}`} key={message.id}>
              {message.content}
              <div className="stale-note" style={{ marginTop: 4 }}>{formatTime(message.created_at)}</div>
            </div>
          ))}
        </div>
        <form action={sendDirectMessage.bind(null, params.id)} className="chat-input-row">
          <span className="prompt">&gt;</span>
          <input name="content" placeholder={`Nachricht an ${otherName} …`} required />
          <button type="submit" className="chat-send">↑</button>
        </form>
      </div>
    </Screen>
  );
}
