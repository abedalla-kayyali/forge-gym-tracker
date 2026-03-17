import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

declare const Supabase: {
  ai: {
    Session: new (model: string) => {
      run(input: string, opts?: { mean_pool?: boolean; normalize?: boolean }): Promise<number[]>;
    };
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return new Response('Unauthorized', { status: 401 });

  let query: string;
  let nResults = 8;
  let typeFilter: string | null = null;
  let history: Array<{ role: string; content: string }> = [];
  let clientDate = new Date().toISOString();
  let clientTz = 'UTC';
  let userContext = '';

  let coach_mode = false;
  let coach_system = '';
  let max_tokens = 900;
  let prefill = '';

  try {
    const body = await req.json();
    query = body.query?.trim();
    if (body.n_results) nResults = Math.min(20, Math.max(1, Number(body.n_results)));
    if (body.type_filter) typeFilter = String(body.type_filter);
    if (Array.isArray(body.history)) history = body.history.slice(-6);
    if (body.client_date) clientDate = String(body.client_date);
    if (body.client_tz) clientTz = String(body.client_tz);
    if (body.user_context) userContext = String(body.user_context).slice(0, 2000);
    if (body.coach_mode) coach_mode = Boolean(body.coach_mode);
    if (body.coach_system) coach_system = String(body.coach_system).slice(0, 500);
    if (body.max_tokens) max_tokens = Math.min(2000, Math.max(10, Number(body.max_tokens)));
    if (body.prefill) prefill = String(body.prefill).slice(0, 200);
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  // Format human-readable date/time for Claude
  const now = new Date(clientDate);
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: clientTz });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: clientTz });

  if (!query || query.length < 2) {
    const enc = new TextEncoder();
    const empty = new ReadableStream({
      start(c) {
        c.enqueue(enc.encode(`event: meta\ndata: ${JSON.stringify({ results: [] })}\n\n`));
        c.enqueue(enc.encode(`event: done\ndata: {}\n\n`));
        c.close();
      },
    });
    return new Response(empty, { headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  }

  // Embed the query
  const session = new Supabase.ai.Session('gte-small');
  let queryEmbedding: number[];
  try {
    queryEmbedding = Array.from(
      await session.run(query, { mean_pool: true, normalize: true })
    );
  } catch (e) {
    console.error('[forge-search] embedding failed', e);
    return new Response(JSON.stringify({ error: 'Embedding failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Vector similarity search
  const { data, error } = await supabase.rpc('match_forge_embeddings', {
    query_embedding: queryEmbedding,
    match_user_id: user.id,
    match_count: nResults,
    type_filter: typeFilter,
  });

  if (error) {
    console.error('[forge-search] rpc error', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const results = data ?? [];
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send results first so UI can render cards immediately
      controller.enqueue(encoder.encode(
        `event: meta\ndata: ${JSON.stringify({ results })}\n\n`
      ));

      if (!coach_mode && (!results || results.length === 0)) {
        if (results.length === 0) {
          controller.enqueue(encoder.encode(
            `event: token\ndata: ${JSON.stringify({ token: "I couldn't find any relevant data. Try indexing your data first." })}\n\n`
          ));
        }
        controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
        controller.close();
        return;
      }
      if (!anthropicKey) {
        controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
        controller.close();
        return;
      }

      const context = results
        .map((r: { type: string; content: string }, i: number) =>
          `[${i + 1}] (${r.type}) ${r.content}`)
        .join('\n');

      try {
        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: coach_mode ? (max_tokens || 80) : 900,
            stream: true,
            system: coach_mode
              ? (coach_system || 'You are FORGE Coach. Be brief and direct.')
              : typeFilter === 'form_cue'
              ? `You are FORGE Coach, a form and technique specialist. When given exercise form cues, explain them clearly and practically. Be encouraging. Max 3 sentences. Reference the specific cue provided.`
              : `You are FORGE, a personal gym AI coach. Today is ${dateStr}, current time is ${timeStr}.

${userContext ? `## USER PROFILE & CURRENT STATS\n${userContext}\n` : ''}
## YOUR ROLE
Answer questions about the user's training, nutrition, body composition, progress, KPIs, and strategy. Use the user profile above as always-available context — it tells you their goals, current stats, training phase, and averages. The training log entries below provide specific historical data to search through.

When asked about goals: compare current stats to target stats and give honest, specific feedback.
When asked about strategy: use their training phase, split, and frequency to give actionable advice.
When asked about KPIs: compute from the data (volume trends, PR frequency, nutrition averages, weight trend).
When asked about "what to fix": be direct and prioritize the top 2-3 actionable improvements.

Format: use **bold** for key numbers and names, use - bullet points for lists, avoid # headings. Be concise and direct. Never make up data not present in the profile or log entries.`,
            messages: [
              ...history,
              {
                role: 'user',
                content: `My question: ${query}\n\nRelevant entries from my training log:\n${context}`,
              },
              ...(prefill ? [{ role: 'assistant', content: prefill }] : []),
            ],
          }),
        });

        if (claudeRes.ok && claudeRes.body) {
          const reader = claudeRes.body.getReader();
          const dec = new TextDecoder();
          let buf = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() ?? '';
            let eventType = '';
            for (const line of lines) {
              if (line.startsWith('event:')) { eventType = line.slice(6).trim(); continue; }
              if (line.startsWith('data:')) {
                try {
                  const payload = JSON.parse(line.slice(5).trim());
                  if (eventType === 'content_block_delta' && payload.delta?.text) {
                    controller.enqueue(encoder.encode(
                      `event: token\ndata: ${JSON.stringify({ token: payload.delta.text })}\n\n`
                    ));
                  }
                } catch { /* skip non-JSON */ }
              }
            }
          }
        } else {
          console.warn('[forge-search] Claude API error', claudeRes.status);
        }
      } catch (e) {
        console.warn('[forge-search] Claude stream failed', e);
      }

      controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
});
