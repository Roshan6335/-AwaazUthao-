import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const email = await verifyAdmin(req);
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = supabaseAdmin();

  const [{ data: stats }, { count: pendingCount }, { data: supporters }] = await Promise.all([
    admin.from('stats').select('total_supporters').eq('id', 1).single(),
    admin.from('voice_messages').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('supporters').select('pincode')
  ]);

  // Group by first-2-digit pincode prefix as a rough "region" breakdown —
  // good enough for a dashboard chart without needing a full geo dataset.
  const regionCounts: Record<string, number> = {};
  for (const s of supporters ?? []) {
    const region = s.pincode.slice(0, 2);
    regionCounts[region] = (regionCounts[region] ?? 0) + 1;
  }

  return NextResponse.json({
    total: stats?.total_supporters ?? 0,
    pendingMessages: pendingCount ?? 0,
    regionCounts
  });
}
