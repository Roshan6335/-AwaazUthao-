'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabasePublic } from '@/lib/supabase';

interface Stats {
  total: number;
  pendingMessages: number;
  regionCounts: Record<string, number>;
}

interface PendingMsg {
  id: string;
  name: string;
  message: string;
  status: string;
  created_at: string;
  supporters: { email: string; pincode: string } | null;
}

interface Update {
  id: string;
  title: string;
  content: string;
  published: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [messages, setMessages] = useState<PendingMsg[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [posting, setPosting] = useState(false);

  const authedFetch = useCallback(
    (url: string, opts: RequestInit = {}) =>
      fetch(url, {
        ...opts,
        headers: { ...opts.headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      }),
    [token]
  );

  useEffect(() => {
    supabasePublic.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push('/admin');
        return;
      }
      setToken(data.session.access_token);
    });
  }, [router]);

  const loadAll = useCallback(async () => {
    if (!token) return;
    const [statsRes, msgRes, updRes] = await Promise.all([
      authedFetch('/api/admin/stats'),
      authedFetch('/api/admin/approve'),
      authedFetch('/api/admin/updates')
    ]);

    if (statsRes.status === 401 || msgRes.status === 401) {
      router.push('/admin');
      return;
    }

    setStats(await statsRes.json());
    setMessages((await msgRes.json()).messages ?? []);
    setUpdates((await updRes.json()).updates ?? []);
  }, [token, authedFetch, router]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function publishUpdate(publishNow: boolean) {
    setPosting(true);
    await authedFetch('/api/admin/updates', {
      method: 'POST',
      body: JSON.stringify({ title, content, video_embed_url: videoUrl || null, published: publishNow })
    });
    setTitle('');
    setContent('');
    setVideoUrl('');
    setPosting(false);
    loadAll();
  }

  async function moderate(id: string, action: 'approve' | 'reject') {
    await authedFetch('/api/admin/approve', { method: 'POST', body: JSON.stringify({ id, action }) });
    loadAll();
  }

  async function togglePublish(u: Update) {
    await authedFetch('/api/admin/updates', {
      method: 'PATCH',
      body: JSON.stringify({ id: u.id, published: !u.published })
    });
    loadAll();
  }

  if (!token) return <p className="text-center py-20 text-steel">Checking access...</p>;

  const pending = messages.filter((m) => m.status === 'pending');

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-14">
      <h1 className="font-display text-3xl">Admin Dashboard</h1>

      {/* STATS */}
      <section className="grid grid-cols-3 gap-4">
        <div className="border border-line rounded p-4 text-center">
          <div className="font-display text-3xl text-alert">{stats?.total ?? '—'}</div>
          <p className="text-xs text-steel mt-1">Total Supporters</p>
        </div>
        <div className="border border-line rounded p-4 text-center">
          <div className="font-display text-3xl text-alert">{stats?.pendingMessages ?? '—'}</div>
          <p className="text-xs text-steel mt-1">Messages Awaiting Approval</p>
        </div>
        <div className="border border-line rounded p-4 text-center">
          <div className="font-display text-3xl text-alert">
            {stats ? Object.keys(stats.regionCounts).length : '—'}
          </div>
          <p className="text-xs text-steel mt-1">Regions Reached</p>
        </div>
      </section>

      {/* PUBLISH NEW UPDATE */}
      <section>
        <h2 className="font-display text-xl mb-4">Publish an Update</h2>
        <div className="space-y-3">
          <input
            className="w-full bg-transparent border border-line rounded px-4 py-3 focus:border-alert outline-none"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full bg-transparent border border-line rounded px-4 py-3 focus:border-alert outline-none"
            placeholder="Write the update here..."
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <input
            className="w-full bg-transparent border border-line rounded px-4 py-3 focus:border-alert outline-none"
            placeholder="YouTube/Instagram embed URL (optional)"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
          <p className="text-xs text-steel">
            For images: upload to Supabase Storage first, then paste the public URL(s)
            here in a future version — for now this form supports text + video embeds.
          </p>
          <div className="flex gap-3">
            <button
              disabled={posting || !title || !content}
              onClick={() => publishUpdate(true)}
              className="bg-alert text-paper font-display px-6 py-3 rounded disabled:opacity-50"
            >
              Publish Now (sends notification)
            </button>
            <button
              disabled={posting || !title || !content}
              onClick={() => publishUpdate(false)}
              className="border border-line px-6 py-3 rounded disabled:opacity-50"
            >
              Save as Draft
            </button>
          </div>
        </div>
      </section>

      {/* EXISTING UPDATES */}
      <section>
        <h2 className="font-display text-xl mb-4">All Updates</h2>
        <div className="space-y-2">
          {updates.map((u) => (
            <div key={u.id} className="border border-line rounded p-3 flex items-center justify-between">
              <span>
                {u.title}{' '}
                <span className={u.published ? 'text-alert text-xs' : 'text-steel text-xs'}>
                  {u.published ? '· published' : '· draft'}
                </span>
              </span>
              <button onClick={() => togglePublish(u)} className="text-sm underline">
                {u.published ? 'Unpublish' : 'Publish'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* MODERATION QUEUE - full internal details as proof */}
      <section>
        <h2 className="font-display text-xl mb-4">
          Pending Voice Wall Messages ({pending.length})
        </h2>
        <div className="space-y-3">
          {pending.map((m) => (
            <div key={m.id} className="border border-line rounded p-4">
              <p className="mb-2">{m.message}</p>
              <p className="text-xs text-steel mb-3">
                {m.name} · {m.supporters?.email} · Pincode {m.supporters?.pincode} ·{' '}
                {new Date(m.created_at).toLocaleString('en-IN')}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => moderate(m.id, 'approve')}
                  className="bg-alert text-paper text-sm px-4 py-2 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => moderate(m.id, 'reject')}
                  className="border border-line text-sm px-4 py-2 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
          {pending.length === 0 && <p className="text-steel text-sm">Nothing waiting for review.</p>}
        </div>
      </section>
    </div>
  );
}
