import LiveCounter from '@/components/LiveCounter';

export default function HomePage() {
  return (
    <div className="px-6">
      <section className="max-w-2xl mx-auto text-center pt-16 pb-12">
        <span className="inline-block text-xs uppercase tracking-widest text-alert border border-alert rounded-full px-3 py-1 mb-6">
          A Citizen Pressure Campaign
        </span>
        <h1 className="font-display text-4xl sm:text-6xl leading-tight">
          Every voice counts.
          <br />
          <span className="text-alert">Every action matters.</span>
        </h1>
        <p className="mt-6 text-lg text-paper/80 max-w-xl mx-auto">
          Not everyone can stand at Jantar Mantar. But everyone can send a real,
          verified message from their own phone — and together, that becomes
          impossible to ignore.
        </p>

        <div className="mt-10">
          <LiveCounter />
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/support"
            className="bg-alert text-paper font-display px-8 py-4 rounded hover:brightness-110 transition"
          >
            Raise Your Voice — 30 Seconds
          </a>
          <a
            href="/wall"
            className="border border-line px-8 py-4 rounded hover:border-alert transition"
          >
            Read What People Are Saying
          </a>
        </div>
      </section>

      <section className="max-w-2xl mx-auto py-12 border-t border-line grid sm:grid-cols-3 gap-8 text-center">
        <div>
          <div className="font-display text-2xl text-alert mb-1">1</div>
          <p className="text-sm text-steel">Verify with your email — takes one tap</p>
        </div>
        <div>
          <div className="font-display text-2xl text-alert mb-1">2</div>
          <p className="text-sm text-steel">We find your MP from your pincode automatically</p>
        </div>
        <div>
          <div className="font-display text-2xl text-alert mb-1">3</div>
          <p className="text-sm text-steel">Send a real message — no bots, no spam, just people</p>
        </div>
      </section>
    </div>
  );
}
