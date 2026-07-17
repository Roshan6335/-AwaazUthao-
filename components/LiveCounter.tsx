'use client';

import { useEffect, useState } from 'react';
import { supabasePublic } from '@/lib/supabase';

export default function LiveCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    // 1. Fetch the current total once on load
    supabasePublic
      .from('stats')
      .select('total_supporters')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (active && data) setCount(data.total_supporters);
      });

    // 2. Subscribe to live changes — updates instantly for every visitor
    //    the moment anyone anywhere submits a pledge. No refresh needed.
    const channel = supabasePublic
      .channel('stats-live')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'stats', filter: 'id=eq.1' },
        (payload) => {
          if (active) setCount((payload.new as { total_supporters: number }).total_supporters);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabasePublic.removeChannel(channel);
    };
  }, []);

  return (
    <div className="text-center">
      <div
        className="counter-digit font-bold text-6xl sm:text-8xl text-alert tabular-nums"
        aria-live="polite"
      >
        {count === null ? '—' : count.toLocaleString('en-IN')}
      </div>
      <p className="mt-2 text-steel text-sm uppercase tracking-widest">
        people have raised their voice
      </p>
    </div>
  );
}
