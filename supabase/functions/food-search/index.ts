import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NormalisedFood {
  id: string;
  name: string;
  brand: string | null;
  per100g: { kcal: number; p: number; c: number; f: number };
  serving: { weight: number; label: string } | null;
}

function nutrient(nutrients: any[], id: number): number {
  return nutrients.find((n: any) => n.nutrientId === id)?.value ?? 0;
}

function normaliseUSDA(data: any): NormalisedFood[] {
  return (data.foods ?? []).slice(0, 8).map((f: any) => {
    const n = f.foodNutrients ?? [];
    const kcal = nutrient(n, 1008);
    const p    = nutrient(n, 1003);
    const c    = nutrient(n, 1005);
    const fat  = nutrient(n, 1004);
    const servingSize   = f.servingSize ?? null;
    const servingUnit   = f.servingSizeUnit ?? 'g';
    return {
      id:     String(f.fdcId),
      name:   f.description ?? 'Unknown',
      brand:  f.brandOwner ?? f.brandName ?? null,
      per100g: { kcal, p, c, f: fat },
      serving: servingSize ? { weight: servingSize, label: `${servingSize}${servingUnit}` } : null,
    } satisfies NormalisedFood;
  });
}

async function fetchOFF(q: string): Promise<NormalisedFood[]> {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=8&fields=id,product_name,brands,nutriments,serving_size`;
  const res = await fetch(url, { headers: { 'User-Agent': 'ForgeApp/1.0' } }).catch(() => null);
  if (!res?.ok) return [];
  const data = await res.json().catch(() => null);
  if (!data?.products) return [];
  return (data.products as any[])
    .filter((p: any) => p.product_name && p.nutriments)
    .slice(0, 8)
    .map((p: any) => {
      const nm = p.nutriments;
      return {
        id:     p.id ?? p._id ?? Math.random().toString(36).slice(2),
        name:   p.product_name,
        brand:  p.brands ?? null,
        per100g: {
          kcal: nm['energy-kcal_100g'] ?? nm['energy_100g'] / 4.184 ?? 0,
          p:    nm['proteins_100g']    ?? 0,
          c:    nm['carbohydrates_100g'] ?? 0,
          f:    nm['fat_100g']         ?? 0,
        },
        serving: p.serving_size
          ? { weight: parseFloat(p.serving_size) || 100, label: p.serving_size }
          : null,
      } satisfies NormalisedFood;
    });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return new Response(JSON.stringify({ results: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let foods: NormalisedFood[] = [];

  // 1. Try USDA FoodData Central
  const usdaKey = Deno.env.get('USDA_API_KEY');
  if (usdaKey) {
    const usdaRes = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&pageSize=8&api_key=${usdaKey}`
    ).catch(() => null);
    if (usdaRes?.ok) {
      const usdaData = await usdaRes.json().catch(() => null);
      if (usdaData) foods = normaliseUSDA(usdaData);
    }
  }

  // 2. Fallback: Open Food Facts (free, no key)
  if (foods.length === 0) {
    foods = await fetchOFF(q);
  }

  return new Response(JSON.stringify({ results: foods.slice(0, 8) }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
