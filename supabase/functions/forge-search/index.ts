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

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
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
    return new Response(JSON.stringify({ results: [] }), {
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

  // Call match function
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

  return new Response(JSON.stringify({ results: data ?? [] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
