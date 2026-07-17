'use client';

import { useState } from 'react';
import { supabasePublic } from '@/lib/supabase';

type Step = 'form' | 'otp' | 'done';

interface MpInfo {
  mp_name: string;
  mp_email: string;
  constituency: string;
}

export default function SupportPage() {
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [pincode, setPincode] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mp, setMp] = useState<MpInfo | null>(null);
  const [supporterNumber, setSupporterNumber] = useState<number | null>(null);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      setError('Please enter a valid 6-digit pincode.');
      return;
    }
    if (name.trim().length < 2) {
      setError('Please enter your name.');
      return;
    }

    setLoading(true);
    const { error: otpError } = await supabasePublic.auth.signInWithOtp({ email });
    setLoading(false);

    if (otpError) {
      setError('Could not send verification code. Please check your email address.');
      return;
    }
    setStep('otp');
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: verifyError } = await supabasePublic.auth.verifyOtp({
      email,
      token: otp,
      type: 'email'
    });

    if (verifyError || !data.session) {
      setLoading(false);
      setError('That code is incorrect or expired. Please try again.');
      return;
    }

    // Now submit the actual pledge to our server, which double-checks
    // rate limits and inserts using the verified session.
    const res = await fetch('/api/support', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.session.access_token}`
      },
      body: JSON.stringify({ name, pincode, email, message })
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? 'Something went wrong. Please try again.');
      return;
    }

    setMp(json.mp ?? null);
    setSupporterNumber(json.supporterNumber ?? null);
    setStep('done');
  }

  async function requestNotifications() {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const registration = await navigator.serviceWorker.register('/sw.js');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    });

    await fetch('/api/notify', {
      method: 'PUT', // PUT = register a new subscriber (see route.ts)
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
  }

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
    <div className="max-w-md mx-auto px-6 py-12">
      {step === 'form' && (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <h1 className="font-display text-2xl mb-2">Raise Your Voice</h1>
          <p className="text-steel text-sm mb-6">
            Your email is used only to confirm you're a real person. It is never
            shown publicly.
          </p>

          <div>
            <label className="block text-sm mb-1">Full name</label>
            <input
              className="w-full bg-transparent border border-line rounded px-4 py-3 focus:border-alert outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Pincode</label>
            <input
              className="w-full bg-transparent border border-line rounded px-4 py-3 focus:border-alert outline-none"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              inputMode="numeric"
              maxLength={6}
              required
            />
            <p className="text-xs text-steel mt-1">Used only to find your MP. Never shown publicly.</p>
          </div>

          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              className="w-full bg-transparent border border-line rounded px-4 py-3 focus:border-alert outline-none"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">
              Your message (optional — shown on the public Voice Wall with your name only)
            </label>
            <textarea
              className="w-full bg-transparent border border-line rounded px-4 py-3 focus:border-alert outline-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={280}
              rows={3}
            />
          </div>

          {error && <p className="text-alert text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-alert text-paper font-display py-3 rounded hover:brightness-110 transition disabled:opacity-50"
          >
            {loading ? 'Sending code...' : 'Send Verification Code'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <h1 className="font-display text-2xl mb-2">Check Your Email</h1>
          <p className="text-steel text-sm mb-6">
            We sent a 6-digit code to {email}. Enter it below.
          </p>
          <input
            className="w-full bg-transparent border border-line rounded px-4 py-3 focus:border-alert outline-none text-center text-2xl tracking-widest"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            inputMode="numeric"
            maxLength={6}
            required
          />
          {error && <p className="text-alert text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-alert text-paper font-display py-3 rounded hover:brightness-110 transition disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify & Submit'}
          </button>
        </form>
      )}

      {step === 'done' && (
        <div className="space-y-6 text-center">
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
            <button
              onClick={requestNotifications}
              className="block w-full border border-line py-3 rounded hover:border-alert transition"
            >
              Notify Me About Major Updates
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
