import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from './supabase';

/**
 * Verifies that the request carries a valid Supabase session AND that
 * the logged-in email is on the admin_users allowlist. Every single
 * admin API route calls this first — if it returns null, the route
 * must immediately return a 401/403.
 */
export async function verifyAdmin(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return null;

  const verifier = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await verifier.auth.getUser(token);
  if (error || !data.user?.email) return null;

  const admin = supabaseAdmin();
  const { data: allowlisted } = await admin
    .from('admin_users')
    .select('email')
    .eq('email', data.user.email.toLowerCase())
    .single();

  return allowlisted ? data.user.email : null;
}
