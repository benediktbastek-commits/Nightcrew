'use client';

import { useRef, useState, type FormEvent } from 'react';
import type { ChatMessage, PlanItem } from '@/lib/types';
import { acceptPlanItem, unacceptPlanItem } from './actions';

const SUGGESTIONS = [
  'Plan mir 3 Posts bis zum nächsten Release',
  'Was steht diese Woche an?',
  'Idee für einen Post zum nächsten Gig',
];

const PLATFORM_LABEL: Record<string, string> = { instagram: 'INSTAGRAM', tiktok: 'TIKTOK', youtube: 'YOUTUBE', spotify: 'SPOTIFY' };

function formatPlanDate(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function CrewAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    setMessages((current) => [...current, { role: 'user', content: trimmed }]);
    setDraft('');
    setThinking(true);

    try {
      const response = await fetch('/api/claude/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, message: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessages((current) => [...current, { role: 'assistant', content: data.error === 'missing_api_key' ? 'Kein Anthropic API-Key hinterlegt.' : 'Da ist etwas schiefgelaufen.' }]);
        return;
      }
      setConversationId(data.conversationId);
      setMessages((current) => [...current, { role: 'assistant', content: data.reply }]);
      if (data.planItems?.length > 0) setPlanItems(data.planItems as PlanItem[]);
    } catch {
      setMessages((current) => [...current, { role: 'assistant', content: 'Verbindung fehlgeschlagen.' }]);
    } finally {
      setThinking(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    sendMessage(draft);
  }

  async function toggleItem(item: PlanItem) {
    setPlanItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, accepted: !entry.accepted } : entry)));
    const result = item.accepted ? await unacceptPlanItem(item.id) : await acceptPlanItem(item.id);
    if (result.error) {
      setPlanItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, accepted: item.accepted } : entry)));
    }
  }

  async function acceptAll() {
    const pending = planItems.filter((item) => !item.accepted);
    setPlanItems((current) => current.map((entry) => ({ ...entry, accepted: true })));
    for (const item of pending) {
      await acceptPlanItem(item.id);
    }
  }

  return (
    <div className="chat-wrapper">
      <div className="chat">
        {messages.length === 0 && (
          <div className="msg ai">Frag mich nach Content-Ideen, was diese Woche ansteht, oder lass mir einen Plan bauen.</div>
        )}
        {messages.map((message, index) => (
          <div className={`msg ${message.role === 'user' ? 'me' : 'ai'}`} key={index}>{message.content}</div>
        ))}
        {thinking && (
          <div className="msg-thinking"><i /><i /><i /></div>
        )}

        {planItems.length > 0 && (
          <>
            <div className="plan-header">
              <span className="label">PLANVORSCHLAG · {String(planItems.length).padStart(2, '0')} POSTS</span>
              <button type="button" onClick={acceptAll}>ALLE ÜBERNEHMEN</button>
            </div>
            {planItems.map((item) => (
              <div className={`plan-card${item.accepted ? ' added' : ''}`} key={item.id}>
                <div className="plan-card-meta">
                  <span>{formatPlanDate(item.planned_for)}</span>
                  <span>{PLATFORM_LABEL[item.platform] ?? item.platform.toUpperCase()}</span>
                </div>
                <p>{item.idea}</p>
                <button type="button" onClick={() => toggleItem(item)}>{item.accepted ? '✓ IM KALENDER' : '+ IN KALENDER'}</button>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="chat-suggestions">
        {SUGGESTIONS.map((suggestion) => (
          <button type="button" key={suggestion} onClick={() => { setDraft(suggestion); inputRef.current?.focus(); }}>
            {suggestion}
          </button>
        ))}
      </div>

      <form className="chat-input-row" onSubmit={handleSubmit}>
        <span className="prompt">&gt;</span>
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Nachricht an Crew AI …"
        />
        <button type="submit" className="chat-send" disabled={!draft.trim() || thinking}>↑</button>
      </form>
    </div>
  );
}
