'use client';

import { useState } from 'react';
import { supabasePublic } from '@/lib/supabase';

type Step = 'form' | 'sent';

export default function SupportPage() {
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [pincode, setPincode] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
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

    // Save the form details on THIS device so we can complete the pledge
    // once the person clicks the link in their email and lands back here.
    localStorage.setItem(
      'awaaz_pending_pledge',
      JSON.stringify({ name: name.trim(), pincode, email: email.toLowerCase(), message })
    );

    const { error: otpError } = await supabasePublic.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/support/confirm`
      }
    });

    setLoading(false);

    if (otpError) {
      setError('Could not send the verification email. Please check your email address.');
      return;
    }
    setStep('sent');
  }

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      {step === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-5">
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
            {loading ? 'Sending...' : 'Send Verification Email'}
          </button>

          <p className="text-xs text-steel text-center">
            Tip: open the confirmation email on this same device/browser for it to work smoothly.
          </p>
        </form>
      )}

      {step === 'sent' && (
        <div className="text-center space-y-4">
          <h1 className="font-display text-2xl">Check Your Email</h1>
          <p className="text-steel">
            We sent a confirmation link to {email}. Open it on this same device to
            complete your pledge.
          </p>
        </div>
      )}
    </div>
  );
}
