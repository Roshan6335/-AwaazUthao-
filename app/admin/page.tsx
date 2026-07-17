'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabasePublic } from '@/lib/supabase';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error } = await supabasePublic.auth.signInWithOtp({ email });
    if (error) {
      setError('Could not send code.');
      return;
    }
    setSent(true);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { data, error } = await supabasePublic.auth.verifyOtp({ email, token: otp, type: 'email' });
    if (error || !data.session) {
      setError('Invalid code.');
      return;
    }
    router.push('/admin/dashboard');
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-20">
      <h1 className="font-display text-2xl mb-6">Admin Login</h1>
      {!sent ? (
        <form onSubmit={sendOtp} className="space-y-4">
          <input
            className="w-full bg-transparent border border-line rounded px-4 py-3 focus:border-alert outline-none"
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="w-full bg-alert text-paper font-display py-3 rounded">
            Send Code
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4">
          <input
            className="w-full bg-transparent border border-line rounded px-4 py-3 focus:border-alert outline-none text-center tracking-widest"
            placeholder="6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <button className="w-full bg-alert text-paper font-display py-3 rounded">
            Verify & Enter
          </button>
        </form>
      )}
      {error && <p className="text-alert text-sm mt-3">{error}</p>}
      <p className="text-xs text-steel mt-6">
        Only pre-approved admin emails (added in the admin_users table) can access
        the dashboard — everyone else is rejected even with a valid code.
      </p>
    </div>
  );
}
