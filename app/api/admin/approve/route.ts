import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';

// GET: list pending messages WITH full supporter details (email, pincode)
// joined in — this is the internal "proof" view only admins ever see.
export async function GET(req: NextRequest) {
  const email = await verifyAdmin(req);
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from('voice_messages')
    .select('id, name, message, status, agree_count, created_at, supporters ( email, pincode )')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Could not load messages.' }, { status: 500 });
  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(req: NextRequest) {
  const email = await verifyAdmin(req);
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, action } = await req.json(); // action: 'approve' | 'reject'
  if (!id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { error } = await admin
    .from('voice_messages')
    .update({ status: action === 'approve' ? 'approved' : 'rejected' })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Could not update message.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
