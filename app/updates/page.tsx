import { supabaseAdmin } from '@/lib/supabase';

export const revalidate = 30; // refresh this page's cache every 30 seconds

export default async function UpdatesPage() {
  const admin = supabaseAdmin();
  const { data: updates } = await admin
    .from('updates')
    .select('id, title, content, image_urls, video_embed_url, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl mb-8">Updates</h1>

      <div className="space-y-10">
        {(updates ?? []).map((u) => (
          <article key={u.id} className="border-b border-line pb-10">
            <p className="text-xs text-steel uppercase tracking-widest mb-2">
              {new Date(u.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <h2 className="font-display text-xl mb-3">{u.title}</h2>
            <p className="whitespace-pre-line text-paper/90 mb-4">{u.content}</p>

            {u.image_urls?.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {u.image_urls.map((src: string) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src} src={src} alt={u.title} className="rounded w-full object-cover" />
                ))}
              </div>
            )}

            {u.video_embed_url && (
              <div className="aspect-video">
                <iframe
                  src={u.video_embed_url}
                  className="w-full h-full rounded"
                  allowFullScreen
                />
              </div>
            )}
          </article>
        ))}

        {(!updates || updates.length === 0) && (
          <p className="text-steel text-center py-12">No updates published yet.</p>
        )}
      </div>
    </div>
  );
}
