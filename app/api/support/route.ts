import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { isValidEmail, isValidName, isValidPincode, sanitizeText, containsBadWords } from '@/lib/sanitize';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);

  // 1. Rate limit — max 5 pledge attempts per minute per IP.
  //    Stops a script from hammering this endpoint.
  if (!checkRateLimit(ip, 5, 60_000)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a minute and try again.' },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { name, pincode, email, message } = body;

  // 2. Validate every field server-side — never trust the client alone.
  if (!isValidName(name)) {
    return NextResponse.json({ error: 'Invalid name.' }, { status: 400 });
  }
  if (!isValidPincode(pincode)) {
    return NextResponse.json({ error: 'Invalid pincode.' }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Invalid email.' }, { status: 400 });
  }

  // 3. Verify the OTP session token actually belongs to this email.
  //    This is what proves a real inbox was verified, not just typed in.
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Missing verification token.' }, { status: 401 });
  }

  const verifierClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: userData, error: userError } = await verifierClient.auth.getUser(token);

  if (userError || !userData.user || userData.user.email?.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: 'Email verification failed.' }, { status: 401 });
  }

  const admin = supabaseAdmin();

  // 4. Insert the supporter record (email_verified = true since OTP passed)
  const { data: supporter, error: insertError } = await admin
    .from('supporters')
    .insert({ name: name.trim(), pincode, email: email.toLowerCase(), email_verified: true })
    .select('id')
    .single();

  if (insertError) {
    // Most common cause: duplicate email (unique index) — treat as a friendly message
    if (insertError.code === '23505') {
      return NextResponse.json(
        { error: 'This email has already been used to pledge support.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Could not save your pledge. Please try again.' }, { status: 500 });
  }

  // 5. If a message was provided, sanitize and queue it for admin approval
  if (message && message.trim().length >= 5) {
    const clean = sanitizeText(message);
    if (!containsBadWords(clean)) {
      await admin.from('voice_messages').insert({
        supporter_id: supporter.id,
        name: name.trim(),
        message: clean,
        status: 'pending'
      });
    }
    // If it contains bad words, we silently drop the message but the
    // pledge itself still counts — we never reject a real supporter
    // over their message text.
  }

  // 6. Look up the user's MP from their pincode (first-3-digit prefix match)
  const prefix = pincode.slice(0, 3);
  const { data: mpRows } = await admin
    .from('mp_directory')
    .select('mp_name, mp_email, constituency')
    .eq('pincode_prefix', prefix)
    .limit(1);

  // 7. Get the supporter's serial number (total count right now)
  const { data: statsRow } = await admin.from('stats').select('total_supporters').eq('id', 1).single();

  return NextResponse.json({
    success: true,
    mp: mpRows && mpRows.length > 0 ? mpRows[0] : null,
    supporterNumber: statsRow?.total_supporters ?? null
  });
}
