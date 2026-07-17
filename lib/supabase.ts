import { createClient } from '@supabase/supabase-js';

// Fallbacks below exist ONLY to stop the build from crashing if an env var
// is momentarily missing during Vercel's build step. If these placeholders
// are ever actually used at runtime, every real Supabase call will fail
// with a clear connection error — which tells you the env vars are wrong,
// instead of an opaque build failure that kills every route on the site.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// PUBLIC client — used in browser & public API routes.
// Respects RLS policies (safe to expose this key).
export const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ADMIN client — used ONLY in server-side admin API routes.
// This key BYPASSES row level security entirely.
// NEVER import this file in any client component or expose this key to the browser.
export function supabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';
  return createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } });
}
