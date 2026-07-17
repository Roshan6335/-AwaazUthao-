'use client';

import { useEffect, useState } from 'react';
import { supabasePublic } from '@/lib/supabase';

interface Msg {
  id: string;
  name: string;
  message: string;
  agree_count: number;
  created_at: string;
}

// Generates (or reuses) an anonymous device fingerprint stored in localStorage.
// This is NOT personal data — it's a random id used only to stop one person
// from clicking "Agree" 500 times on the same message.
function getFingerprint(): string {
  const key = 'awaaz_fp';
  let fp = localStorage.getItem(key);
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem(key, fp);
  }
  return fp;
}

export default function VoiceWallPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [agreedIds, setAgreedIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabasePublic
      .from('voice_messages')
      .select('id, name, message, agree_count, created_at')
      .eq('status', 'approved')
      .order('agree_count', { ascending: false })
      .then(({ data }) => setMessages(data ?? []));

    const stored = localStorage.getItem('awaaz_agreed');
    if (stored) setAgreedIds(new Set(JSON.parse(stored)));
  }, []);

  async function handleAgree(id: string) {
    // Guard 1: already agreed on this device — button is disabled, but
    // double-check here too in case of stale UI state.
    if (agreedIds.has(id) || pendingIds.has(id)) return;

    // Guard 2: optimistic lock — disable immediately so a rapid double
    // click can't fire two requests before state updates.
    setPendingIds((prev) => new Set(prev).add(id));

    const fingerprint = getFingerprint();
    const res = await fetch('/api/agree', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: id, fingerprint })
    });

    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    if (res.ok) {
      // Guard 3: the database has a UNIQUE(message_id, fingerprint)
      // constraint, so even if this same request somehow fired twice,
      // the second insert is rejected at the database level and the
      // count trigger never double-fires. This local state is just UI.
      const next = new Set(agreedIds).add(id);
      setAgreedIds(next);
      localStorage.setItem('awaaz_agreed', JSON.stringify([...next]));
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, agree_count: m.agree_count + 1 } : m))
      );
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl mb-2">Voice Wall</h1>
      <p className="text-steel mb-8">Real names. Real messages. Real people.</p>

      <div className="space-y-4">
        {messages.map((m) => {
          const alreadyAgreed = agreedIds.has(m.id);
          return (
            <div key={m.id} className="border border-line rounded p-5">
              <p className="mb-3">{m.message}</p>
              <div className="flex items-center justify-between text-sm text-steel">
                <span>— {m.name}</span>
                <button
                  onClick={() => handleAgree(m.id)}
                  disabled={alreadyAgreed || pendingIds.has(m.id)}
                  className={`px-3 py-1 rounded border transition ${
                    alreadyAgreed
                      ? 'border-alert text-alert cursor-default'
                      : 'border-line hover:border-alert'
                  }`}
                >
                  {alreadyAgreed ? '✓ Agreed' : 'I agree too'} · {m.agree_count}
                </button>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <p className="text-steel text-center py-12">No messages yet. Be the first.</p>
        )}
      </div>
    </div>
  );
}
