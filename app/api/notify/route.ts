import { NextRequest, NextResponse } from 'next/server';
import webPush from 'web-push';
import { supabaseAdmin } from '@/lib/supabase';

webPush.setVapidDetails(
  'mailto:admin@example.com', // change to your real contact email
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// PUT — called from the browser when a visitor grants notification permission.
// Stores their push subscription so we can reach them later. Free forever —
// this uses the browser's native Push API, not any paid SMS/notification service.
export async function PUT(req: NextRequest) {
  const subscription = await req.json();
  const admin = supabaseAdmin();

  const { error } = await admin.from('push_subscriptions').upsert(
    {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth
    },
    { onConflict: 'endpoint' }
  );

  if (error) return NextResponse.json({ error: 'Could not save subscription.' }, { status: 500 });
  return NextResponse.json({ success: true });
}

// POST — called internally (by the admin updates route) when a new update
// is published. Sends a notification to every stored subscriber.
export async function POST(req: NextRequest) {
  const { title, url } = await req.json();
  const admin = supabaseAdmin();

  const { data: subs } = await admin.from('push_subscriptions').select('*');
  if (!subs || subs.length === 0) return NextResponse.json({ sent: 0 });

  const payload = JSON.stringify({
    title: 'Awaaz Uthao',
    body: title ?? 'A new update was just published.',
    url: url ?? '/updates'
  });

  let sent = 0;
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (err: any) {
        // A 410 Gone means the subscription is dead (user uninstalled, cleared
        // data, etc.) — clean it up so we stop wasting requests on it.
        if (err?.statusCode === 410) {
          await admin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
      }
    })
  );

  return NextResponse.json({ sent });
}
