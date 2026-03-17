import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supabase edge runtime exposes this global for on-device inference (no API key needed)
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

  let items: Array<{ id: string; type: string; date: string; content: string; metadata: Record<string, unknown> }>;
  try {
    ({ items } = await req.json());
    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ indexed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const session = new Supabase.ai.Session('gte-small');
  const rows = [];

  for (const item of items) {
    if (!item.id || !item.content) continue;
    try {
      const embedding = await session.run(item.content, { mean_pool: true, normalize: true });
      rows.push({
        id: `${user.id}_${item.id}`,   // scope to user so IDs don't collide across accounts
        user_id: user.id,
        type: item.type ?? 'unknown',
        date: item.date ?? '',
        content: item.content,
        embedding: Array.from(embedding),
        metadata: item.metadata ?? {},
      });
    } catch (e) {
      console.warn('[forge-ingest] embedding failed for item', item.id, e);
    }
  }

  if (rows.length === 0) {
    return new Response(JSON.stringify({ indexed: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { error } = await supabase
    .from('forge_embeddings')
    .upsert(rows, { onConflict: 'id' });

  if (error) {
    console.error('[forge-ingest] upsert error', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ indexed: rows.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
