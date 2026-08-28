import { NextResponse } from 'next/server';
import type Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient } from '@/lib/anthropic';
import { hasAiAccess } from '@/lib/ai-access';
import type { SupabaseClient } from '@supabase/supabase-js';

const LIST_UPCOMING_TOOL: Anthropic.Tool = {
  name: 'list_upcoming',
  description: 'Liest kommende Gigs, Releases und bereits geplante Posts innerhalb eines Zeitraums.',
  input_schema: {
    type: 'object',
    properties: {
      range_days: { type: 'integer', description: 'Anzahl Tage ab heute, z.B. 14, 30, 90' },
    },
    required: ['range_days'],
  },
};

const GET_PERFORMANCE_SUMMARY_TOOL: Anthropic.Tool = {
  name: 'get_performance_summary',
  description: 'Liest die aktuellsten bekannten Account-Kennzahlen pro Plattform (aus Screenshot-Importen).',
  input_schema: { type: 'object', properties: {} },
};

const PROPOSE_CONTENT_PLAN_TOOL: Anthropic.Tool = {
  name: 'propose_content_plan',
  description: 'Schreibt Content-Vorschläge als Plan-Entwurf. Legt KEINE Posts an — das macht erst der Nutzer durch Übernehmen.',
  input_schema: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            planned_for: { type: 'string', description: 'ISO-Datum' },
            platform: { type: 'string', enum: ['instagram', 'tiktok', 'youtube', 'spotify'] },
            idea: { type: 'string', description: 'Kurze Beschreibung der Content-Idee' },
          },
          required: ['planned_for', 'platform', 'idea'],
        },
      },
    },
    required: ['items'],
  },
};

const TOOLS = [LIST_UPCOMING_TOOL, GET_PERFORMANCE_SUMMARY_TOOL, PROPOSE_CONTENT_PLAN_TOOL];

async function runTool(supabase: SupabaseClient, conversationId: string, name: string, input: Record<string, unknown>) {
  if (name === 'list_upcoming') {
    const rangeDays = Number(input.range_days) || 30;
    const today = new Date().toISOString().slice(0, 10);
    const until = new Date(Date.now() + rangeDays * 86400000).toISOString().slice(0, 10);
    const [{ data: gigs }, { data: releases }, { data: posts }] = await Promise.all([
      supabase.from('gigs').select('venue, city, date, status').gte('date', today).lte('date', until).order('date'),
      supabase.from('releases').select('title, release_date, status').gte('release_date', today).lte('release_date', until).order('release_date'),
      supabase.from('posts').select('platform, planned_at, status, caption').gte('planned_at', today).lte('planned_at', until).order('planned_at'),
    ]);
    return JSON.stringify({ gigs: gigs ?? [], releases: releases ?? [], posts: posts ?? [] });
  }

  if (name === 'get_performance_summary') {
    const { data } = await supabase.from('account_metrics').select('platform, period_start, period_end, views, reach, likes, comments').order('period_end', { ascending: false }).limit(10);
    if (!data || data.length === 0) return JSON.stringify({ note: 'Noch keine Analytics-Daten importiert.' });
    return JSON.stringify({ recent_metrics: data });
  }

  if (name === 'propose_content_plan') {
    const items = Array.isArray(input.items) ? input.items : [];
    const rows = items.map((item: { planned_for: string; platform: string; idea: string }) => ({
      conversation_id: conversationId,
      planned_for: item.planned_for,
      platform: item.platform,
      idea: item.idea,
    }));
    if (rows.length === 0) return JSON.stringify({ error: 'keine items' });
    const { data, error } = await supabase.from('ai_plan_items').insert(rows).select('id');
    if (error) {
      console.error('[propose_content_plan]', error);
      return JSON.stringify({ error: 'speichern fehlgeschlagen' });
    }
    return JSON.stringify({ saved: data?.length ?? 0 });
  }

  return JSON.stringify({ error: 'unbekanntes werkzeug' });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await hasAiAccess())) return NextResponse.json({ error: 'access_code_required' }, { status: 403 });

  const anthropic = getAnthropicClient();
  if (!anthropic) return NextResponse.json({ error: 'missing_api_key' }, { status: 503 });

  const body = await request.json() as { conversationId?: string; message?: string };
  const userMessage = (body.message ?? '').trim();
  if (!userMessage) return NextResponse.json({ error: 'missing_message' }, { status: 400 });

  let conversationId = body.conversationId;
  if (!conversationId) {
    const { data: conversation, error: conversationError } = await supabase
      .from('ai_conversations')
      .insert({ user_id: user.id, context: 'planner' })
      .select('id')
      .single();
    if (conversationError || !conversation) {
      console.error('[chat] create conversation', conversationError);
      return NextResponse.json({ error: 'conversation_failed' }, { status: 500 });
    }
    conversationId = conversation.id;
  }
  const convoId = conversationId!;

  const { data: history } = await supabase
    .from('ai_messages')
    .select('role, content')
    .eq('conversation_id', convoId)
    .order('created_at', { ascending: true });

  await supabase.from('ai_messages').insert({ conversation_id: convoId, role: 'user', content: userMessage });

  const today = new Date().toISOString().slice(0, 10);
  const [{ data: nextGig }, { data: nextRelease }, { count: plannedPostsCount }] = await Promise.all([
    supabase.from('gigs').select('venue, city, date').gte('date', today).order('date').limit(1).maybeSingle(),
    supabase.from('releases').select('title, release_date').gte('release_date', today).order('release_date').limit(1).maybeSingle(),
    supabase.from('posts').select('*', { count: 'exact', head: true }).gte('planned_at', today),
  ]);

  const systemPrompt = `Du bist der Content-Planer in der Nightcrew-App eines DJs/Producers. Antworte kurz, konkret, auf Deutsch.
Kontext:
- Nächster Gig: ${nextGig ? `${nextGig.venue}, ${nextGig.city}, ${nextGig.date}` : 'keiner geplant'}
- Nächstes Release: ${nextRelease ? `${nextRelease.title}, VÖ ${nextRelease.release_date}` : 'keins geplant'}
- Bereits geplante Posts (ab heute): ${plannedPostsCount ?? 0}

Werkzeuge: list_upcoming für mehr Details zu Gigs/Releases/Posts, get_performance_summary für bekannte Analytics-Werte, propose_content_plan um einen Plan-Entwurf zu speichern (legt NIE direkt Posts an — das macht nur der Nutzer durch Übernehmen).`;

  const messages: Anthropic.MessageParam[] = [
    ...((history ?? []) as { role: 'user' | 'assistant'; content: string }[]).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: userMessage },
  ];

  let finalText = '';
  const proposedItemIds: string[] = [];

  try {
    for (let iteration = 0; iteration < 5; iteration++) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: systemPrompt,
        tools: TOOLS,
        messages,
      });

      const textBlocks = response.content.filter((block) => block.type === 'text');
      finalText = textBlocks.map((block) => (block as Anthropic.TextBlock).text).join('\n');

      if (response.stop_reason !== 'tool_use') break;

      messages.push({ role: 'assistant', content: response.content });

      const toolUseBlocks = response.content.filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use');
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUseBlocks) {
        const result = await runTool(supabase, convoId, toolUse.name, toolUse.input as Record<string, unknown>);
        if (toolUse.name === 'propose_content_plan') {
          try {
            const parsed = JSON.parse(result);
            if (parsed.saved) proposedItemIds.push(convoId);
          } catch {
            // ignore
          }
        }
        toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: result });
      }
      messages.push({ role: 'user', content: toolResults });
    }
  } catch (error) {
    console.error('[chat] anthropic', error);
    return NextResponse.json({ error: 'chat_failed' }, { status: 502 });
  }

  await supabase.from('ai_messages').insert({ conversation_id: convoId, role: 'assistant', content: finalText });

  let planItems: unknown[] = [];
  if (proposedItemIds.length > 0) {
    const { data } = await supabase
      .from('ai_plan_items')
      .select('*')
      .eq('conversation_id', convoId)
      .order('created_at', { ascending: true });
    planItems = data ?? [];
  }

  return NextResponse.json({ conversationId: convoId, reply: finalText, planItems });
}
