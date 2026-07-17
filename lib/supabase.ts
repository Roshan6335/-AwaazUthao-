import { createClient } from '@supabase/supabase-js';

// PUBLIC client — used in browser & public API routes.
// Respects RLS policies (safe to expose this key).
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ADMIN client — used ONLY in server-side admin API routes.
// This key BYPASSES row level security entirely.
// NEVER import this file in any client component or expose this key to the browser.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
