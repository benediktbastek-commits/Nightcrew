import { NextResponse } from 'next/server';
import type Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient } from '@/lib/anthropic';
import { hasAiAccess } from '@/lib/ai-access';
import type { ImportKind, PostPlatform } from '@/lib/types';

const ACCOUNT_TOOL: Anthropic.Tool = {
  name: 'extract_account_metrics',
  description: 'Liest Account-Kennzahlen aus einem Analytics-Screenshot (z.B. Spotify for Artists, Instagram Insights).',
  input_schema: {
    type: 'object',
    properties: {
      platform: { type: 'string', enum: ['instagram', 'tiktok', 'youtube', 'spotify'] },
      period_start: { type: 'string', description: 'ISO-Datum, leer wenn nicht sichtbar' },
      period_end: { type: 'string', description: 'ISO-Datum, leer wenn nicht sichtbar' },
      views: { type: 'integer', description: 'Aufrufe / Views' },
      reach: { type: 'integer', description: 'Reichweite / Betrachter' },
      profile_views: { type: 'integer' },
      followers_delta: { type: 'integer' },
      interactions: { type: 'integer', description: 'Grobe Gesamt-Interaktionen, falls keine Einzelwerte sichtbar sind' },
      likes: { type: 'integer' },
      comments: { type: 'integer' },
      reposts: { type: 'integer' },
      shares: { type: 'integer', description: 'Geteilte Inhalte' },
      saves: { type: 'integer', description: 'Gespeicherte Inhalte' },
      confidence: {
        type: 'object',
        description: 'Pro Feldname 0-1, wie sicher der Wert im Bild lesbar war',
        additionalProperties: { type: 'number' },
      },
      unreadable_fields: { type: 'array', items: { type: 'string' } },
    },
    required: ['platform', 'confidence'],
  },
};

const POST_TOOL: Anthropic.Tool = {
  name: 'extract_post_metrics',
  description: 'Liest Post-Kennzahlen aus einem Analytics-Screenshot für einen einzelnen Beitrag.',
  input_schema: {
    type: 'object',
    properties: {
      platform: { type: 'string', enum: ['instagram', 'tiktok', 'youtube', 'spotify'] },
      posted_date: { type: 'string', description: 'ISO-Datum, leer wenn nicht sichtbar' },
      views: { type: 'integer' },
      likes: { type: 'integer' },
      saves: { type: 'integer' },
      shares: { type: 'integer' },
      followers_delta: { type: 'integer' },
      avg_watch_seconds: { type: 'number' },
      completion_rate: { type: 'number' },
      analysis: {
        type: 'string',
        description: 'Kurze, einfache Einschätzung auf Deutsch (2-3 Sätze): was an diesem Post gut oder schlecht gelaufen ist, basierend auf den erkannten Zahlen (z.B. Verhältnis Likes/Views, Completion Rate, Saves im Vergleich zur Reichweite). Konkret und knapp, keine Floskeln.',
      },
      confidence: {
        type: 'object',
        description: 'Pro Feldname 0-1, wie sicher der Wert im Bild lesbar war',
        additionalProperties: { type: 'number' },
      },
      unreadable_fields: { type: 'array', items: { type: 'string' } },
    },
    required: ['platform', 'confidence', 'analysis'],
  },
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await hasAiAccess())) return NextResponse.json({ error: 'access_code_required' }, { status: 403 });

  const anthropic = getAnthropicClient();
  if (!anthropic) return NextResponse.json({ error: 'missing_api_key' }, { status: 503 });

  const body = await request.json() as { imageBase64?: string; mediaType?: string; kind?: ImportKind };
  const { imageBase64, mediaType, kind } = body;
  if (!imageBase64 || !mediaType || !kind) {
    return NextResponse.json({ error: 'missing_image' }, { status: 400 });
  }

  const tool = kind === 'account' ? ACCOUNT_TOOL : POST_TOOL;

  let message: Anthropic.Message;
  try {
    message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      temperature: 0,
      tools: [tool],
      tool_choice: { type: 'tool', name: tool.name },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType as 'image/jpeg' | 'image/png', data: imageBase64 } },
            { type: 'text', text: kind === 'account' ? 'Lies die Account-Kennzahlen aus diesem Screenshot aus.' : 'Lies die Post-Kennzahlen aus diesem Screenshot aus und gib eine kurze Einschätzung, was an diesem Post gut oder schlecht gelaufen ist.' },
          ],
        },
      ],
    });
  } catch (error) {
    console.error('[extract] anthropic', error);
    return NextResponse.json({ error: 'extraction_failed' }, { status: 502 });
  }

  const toolUse = message.content.find((block) => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    return NextResponse.json({ error: 'no_extraction' }, { status: 502 });
  }
  const extraction = toolUse.input as Record<string, unknown>;

  const path = `${user.id}/${crypto.randomUUID()}.jpg`;
  const buffer = Buffer.from(imageBase64, 'base64');
  const { error: uploadError } = await supabase.storage.from('imports').upload(path, buffer, { contentType: mediaType });
  if (uploadError) console.error('[extract] upload', uploadError);

  const { data: importRow, error: importError } = await supabase
    .from('imports')
    .insert({
      user_id: user.id,
      platform: (extraction.platform as PostPlatform) ?? 'instagram',
      kind,
      image_path: path,
      raw_extraction: extraction,
      confidence: extraction.confidence ?? {},
    })
    .select('id')
    .single();
  if (importError) console.error('[extract] insert import', importError);

  return NextResponse.json({ importId: importRow?.id ?? null, extraction });
}
