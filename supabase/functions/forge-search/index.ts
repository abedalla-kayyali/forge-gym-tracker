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

  try {
    const body = await req.json();
    query = body.query?.trim();
    if (body.n_results) nResults = Math.min(20, Math.max(1, Number(body.n_results)));
    if (body.type_filter) typeFilter = String(body.type_filter);
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  if (!query || query.length < 2) {
    return new Response(JSON.stringify({ answer: '', results: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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

  // No results — return early without calling Claude
  if (results.length === 0) {
    return new Response(JSON.stringify({ answer: "I couldn't find any relevant data for that. Try indexing your data first.", results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Build context from top results
  const context = results
    .map((r: { type: string; content: string }, i: number) => `[${i + 1}] (${r.type}) ${r.content}`)
    .join('\n');

  // Call Claude for a natural language answer
  let answer = '';
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (anthropicKey) {
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
          max_tokens: 300,
          system: `You are FORGE, a personal gym assistant. Answer the user's question using only the provided training data entries. Be concise and specific — include dates, weights, reps, and other numbers when relevant. If the data doesn't fully answer the question, say so briefly. Never make up data.`,
          messages: [{
            role: 'user',
            content: `My question: ${query}\n\nRelevant entries from my training log:\n${context}`,
          }],
        }),
      });

      if (claudeRes.ok) {
        const claudeData = await claudeRes.json();
        answer = claudeData.content?.[0]?.text ?? '';
      } else {
        console.warn('[forge-search] Claude API error', claudeRes.status);
      }
    } catch (e) {
      console.warn('[forge-search] Claude call failed', e);
    }
  }

  return new Response(JSON.stringify({ answer, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
