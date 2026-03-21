// supabase/functions/forge-parse/index.ts
// Parses a voice transcript into structured workout log data via Claude Haiku

import Anthropic from "npm:@anthropic-ai/sdk@0.27.3";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return new Response(JSON.stringify({ error: "Supabase env missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const token = authHeader.replace("Bearer ", "").trim();
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { transcript } = await req.json();
    if (!transcript || typeof transcript !== "string") {
      return new Response(JSON.stringify({ error: "transcript required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: `You are a fitness data parser. Extract workout data from voice transcripts.
Always respond with valid JSON only. No explanation. No markdown.
Output format: {"exercise":"string","weight":number,"unit":"kg"|"lbs","reps":number,"rpe":number|null,"sets":number}
- weight/reps/sets must be numbers (not strings)
- rpe is 1-10 scale (null if not mentioned)
- unit defaults to "kg" unless "pounds" or "lbs" or "lb" is mentioned
- sets defaults to 1 unless explicitly stated
- If you cannot parse, return {"error":"could not parse"}`,
      messages: [{ role: "user", content: `Parse this workout voice log: "${transcript}"` }]
    });

    const rawText = (response.content[0] as { type: string; text: string }).text.trim();
    // Strip markdown code fences if model wraps output despite instructions
    const raw = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    // Validate it's JSON
    let parsed: unknown;
    try { parsed = JSON.parse(raw); }
    catch { return new Response(JSON.stringify({ error: "parse failed" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    }); }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
