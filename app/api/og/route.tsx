import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name') ?? 'A Supporter';
  const number = searchParams.get('number') ?? '—';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#121212',
          color: '#F5F5F0',
          fontFamily: 'sans-serif',
          padding: 60
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 4, color: '#E63946', marginBottom: 20 }}>
          AWAAZ UTHAO
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, textAlign: 'center', marginBottom: 20 }}>
          {name} raised their voice
        </div>
        <div style={{ fontSize: 32, color: '#E63946', marginBottom: 30 }}>
          Supporter #{number}
        </div>
        <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 20 }}>
          In support of Sonam Wangchuk and the CJP demand for accountability.
        </div>
        <div style={{ fontSize: 24, color: '#4A5859' }}>
          Add your voice at awaazuthao.vercel.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

// NOTE: once CJP grants permission to use their official logo, add an
// <img src="..."> element above pointing at a hosted logo file, and swap
// the placeholder site URL for your real final domain.
