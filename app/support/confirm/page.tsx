'use client';

import { useEffect, useState } from 'react';
import { supabasePublic } from '@/lib/supabase';

interface MpInfo {
  mp_name: string;
  mp_email: string;
  constituency: string;
}

type Status = 'checking' | 'error' | 'done';

export default function ConfirmPage() {
  const [status, setStatus] = useState<Status>('checking');
  const [error, setError] = useState<string | null>(null);
  const [mp, setMp] = useState<MpInfo | null>(null);
  const [supporterNumber, setSupporterNumber] = useState<number | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    async function complete() {
      // Supabase automatically parses the magic-link tokens from the URL
      // and creates a session on page load (detectSessionInUrl is on by
      // default) — we just need to wait for it and then read it back.
      const { data, error: sessionError } = await supabasePublic.auth.getSession();

      if (sessionError || !data.session) {
        setStatus('error');
        setError('This link is invalid or has expired. Please go back and try again.');
        return;
      }

      const pendingRaw = localStorage.getItem('awaaz_pending_pledge');
      if (!pendingRaw) {
        setStatus('error');
        setError(
          'We could not find your pledge details on this device. If you opened this link on a different device or browser, please go back and submit the form again.'
        );
        return;
      }

      const pending = JSON.parse(pendingRaw);
      setName(pending.name);

      const res = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.session.access_token}`
        },
        body: JSON.stringify(pending)
      });

      const json = await res.json();

      if (!res.ok) {
        setStatus('error');
        setError(json.error ?? 'Something went wrong. Please try again.');
        return;
      }

      localStorage.removeItem('awaaz_pending_pledge');
      setMp(json.mp ?? null);
      setSupporterNumber(json.supporterNumber ?? null);
      setStatus('done');
    }

    complete();
  }, []);

  const mailtoLink = mp
    ? `mailto:${mp.mp_email}?subject=${encodeURIComponent(
        'Constituent request: action on exam paper leaks'
      )}&body=${encodeURIComponent(
        `Dear ${mp.mp_name},\n\nAs a constituent of ${mp.constituency}, I am writing to request urgent action on the recent exam paper leak issue affecting students nationwide. I stand with the demand for accountability and a transparent investigation.\n\nRegards,\n${name}`
      )}`
    : '#';

  const tweetLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `I'm adding my voice to the demand for accountability on the exam paper leaks. Join me. #AwaazUthao`
  )}`;

  return (
    <div className="max-w-md mx-auto px-6 py-16 text-center">
      {status === 'checking' && <p className="text-steel">Confirming your pledge...</p>}

      {status === 'error' && (
        <div className="space-y-4">
          <p className="text-alert">{error}</p>
          <a href="/support" className="underline text-sm">
            Back to the form
          </a>
        </div>
      )}

      {status === 'done' && (
        <div className="space-y-6">
          <h1 className="font-display text-2xl">
            You're Supporter #{supporterNumber?.toLocaleString('en-IN')}
          </h1>
          <p className="text-steel">Thank you. Now finish the job — send your message.</p>

          <div className="space-y-3">
            <a
              href={mailtoLink}
              className="block w-full bg-alert text-paper font-display py-3 rounded hover:brightness-110 transition"
            >
              Email Your MP Now
            </a>
            <a
              href={tweetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full border border-line py-3 rounded hover:border-alert transition"
            >
              Post on X / Twitter
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
