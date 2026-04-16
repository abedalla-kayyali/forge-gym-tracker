import { createClient } from '@supabase/supabase-js';

// Same public credentials as the existing app (js/config.js).
// The anon key is safe to expose — Supabase RLS enforces access control.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://mnqetnzdgtbeysqnmbkx.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ucWV0bnpkZ3RiZXlzcW5tYmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMzMzMzgsImV4cCI6MjA4ODcwOTMzOH0.yqgdzeFUyqU3Lkg6cyCt0Kl3l525kD60oTi_p93AuXw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
