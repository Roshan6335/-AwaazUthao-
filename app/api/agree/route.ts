import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);

  // Generous limit here since a real user may agree with several messages
  // in one session, but still capped to stop scripted mass-agreeing.
  if (!checkRateLimit(ip, 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const { messageId, fingerprint } = await req.json();
  if (!messageId || !fingerprint) {
    return NextResponse.json({ error: 'Missing data.' }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { error } = await admin
    .from('message_agrees')
    .insert({ message_id: messageId, voter_fingerprint: fingerprint });

  if (error) {
    // Postgres error 23505 = unique_violation.
    // This fires when the SAME fingerprint tries to agree with the SAME
    // message twice — the database itself refuses it, so the count can
    // never be inflated even if the frontend guard is somehow bypassed.
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already agreed.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Could not record agreement.' }, { status: 500 });
  }

  // The database trigger (trg_increment_agree) has already incremented
  // agree_count atomically at this point — no race condition possible
  // even under concurrent requests, because Postgres serializes the
  // row-level UPDATE inside the trigger.
  return NextResponse.json({ success: true });
}
