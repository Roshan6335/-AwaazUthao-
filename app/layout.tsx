import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Awaaz Uthao',
  description: 'One phone, one voice. Real pressure from real people.',
  manifest: '/manifest.json'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;700&family=IBM+Plex+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#121212" />
      </head>
      <body className="font-body min-h-screen">
        <nav className="border-b border-line px-6 py-4 flex items-center justify-between">
          <a href="/" className="font-display text-lg tracking-tight">
            AWAAZ UTHAO
          </a>
          <div className="flex gap-5 text-sm">
            <a href="/updates" className="hover:text-alert transition-colors">Updates</a>
            <a href="/wall" className="hover:text-alert transition-colors">Voice Wall</a>
            <a href="/support" className="hover:text-alert transition-colors">Take Action</a>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="border-t border-line px-6 py-8 mt-16 text-sm text-steel">
          This is an independent citizen initiative. Your email is used only to
          verify you're a real person — it is never shown publicly.
        </footer>
      </body>
    </html>
  );
}
