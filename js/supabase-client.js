// FORGE Supabase Client
// Initializes the Supabase JS client from window.FORGE_CONFIG.
// Must be loaded AFTER the Supabase CDN script and AFTER config.js.
// Exposes: window._sb (supabase client)

(function () {
  'use strict';

  const cfg = window.FORGE_CONFIG;
  if (!cfg || !cfg.SUPABASE_URL || cfg.SUPABASE_URL === 'https://YOUR_PROJECT.supabase.co') {
    console.warn('[FORGE] Supabase not configured — edit js/config.js with your project URL and anon key.');
    window._sb = null;
    return;
  }

  if (typeof window.supabase === 'undefined') {
    console.error('[FORGE] Supabase SDK not loaded. Check CDN script tag in index.html.');
    window._sb = null;
    return;
  }

  window._sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });

  console.log('[FORGE] Supabase client initialized.');
})();
