import { notFound } from 'next/navigation';
import { Screen } from '@/components/screen';
import { createClient } from '@/lib/supabase/server';
import { sendMessage } from '../actions';
import type { ConnectionMessage } from '@/lib/types';

function formatTime(iso: string) {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default async function ConnectionChatPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: request } = await supabase.from('service_requests').select('*').eq('id', params.id).single();
  if (!request || request.status !== 'matched' || (request.dj_user_id !== user.id && request.matched_photographer_id !== user.id)) {
    notFound();
  }

  const otherUserId = request.dj_user_id === user.id ? request.matched_photographer_id : request.dj_user_id;
  const [{ data: messagesData }, { data: otherProfile }] = await Promise.all([
    supabase.from('messages').select('*').eq('request_id', params.id).order('created_at', { ascending: true }),
    otherUserId ? supabase.from('profiles').select('display_name').eq('id', otherUserId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const messages = (messagesData ?? []) as ConnectionMessage[];
  const otherName = otherProfile?.display_name ?? 'Kontakt';

  return (
    <Screen title={`CHAT · ${otherName.toUpperCase()}`} back="/marketplace">
      <div className="chat-wrapper">
        <div className="chat">
          {messages.length === 0 && <div className="msg ai">Noch keine Nachrichten zu {request.location}.</div>}
          {messages.map((message) => (
            <div className={`msg ${message.sender_id === user.id ? 'me' : 'ai'}`} key={message.id}>
              {message.content}
              <div className="stale-note" style={{ marginTop: 4 }}>{formatTime(message.created_at)}</div>
            </div>
          ))}
        </div>
        <form action={sendMessage.bind(null, params.id)} className="chat-input-row">
          <span className="prompt">&gt;</span>
          <input name="content" placeholder={`Nachricht an ${otherName} …`} required />
          <button type="submit" className="chat-send">↑</button>
        </form>
      </div>
    </Screen>
  );
}
