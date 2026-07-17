import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const email = await verifyAdmin(req);
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = supabaseAdmin();
  const { data } = await admin.from('updates').select('*').order('created_at', { ascending: false });
  return NextResponse.json({ updates: data ?? [] });
}

export async function POST(req: NextRequest) {
  const email = await verifyAdmin(req);
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, content, image_urls, video_embed_url, published } = await req.json();
  if (!title || !content) {
    return NextResponse.json({ error: 'Title and content are required.' }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from('updates')
    .insert({
      title,
      content,
      image_urls: image_urls ?? [],
      video_embed_url: video_embed_url ?? null,
      published: !!published
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Could not create update.' }, { status: 500 });

  // If publishing immediately, trigger a push notification to all subscribers.
  if (published) {
    await fetch(`${req.nextUrl.origin}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, url: '/updates' })
    });
  }

  return NextResponse.json({ update: data });
}

export async function PATCH(req: NextRequest) {
  const email = await verifyAdmin(req);
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, ...fields } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });

  const admin = supabaseAdmin();

  // Detect the transition pending -> published to fire a notification exactly once.
  const { data: before } = await admin.from('updates').select('published, title').eq('id', id).single();

  const { data, error } = await admin.from('updates').update(fields).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: 'Could not update.' }, { status: 500 });

  if (fields.published === true && before && before.published === false) {
    await fetch(`${req.nextUrl.origin}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: data.title, url: '/updates' })
    });
  }

  return NextResponse.json({ update: data });
}

export async function DELETE(req: NextRequest) {
  const email = await verifyAdmin(req);
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  const admin = supabaseAdmin();
  const { error } = await admin.from('updates').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Could not delete.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
