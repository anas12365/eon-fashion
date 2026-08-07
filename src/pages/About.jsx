import PageTransition from '../components/PageTransition';
import InfinityBackground from '../components/InfinityBackground';
import InfinityMark from '../components/InfinityMark';

const PILLARS = [
  {
    title: 'Endless Evolution',
    body: 'Every collection folds back into the last. Nothing is discontinued — pieces are refined, reissued, reworked.',
  },
  {
    title: 'Precision Cut',
    body: 'Patterns are engineered before they are decorated. Fit comes first; everything else is in service of it.',
  },
  {
    title: 'Electric Restraint',
    body: 'One accent color, used deliberately. The blue marks intent — hardware, seams, the infinity mark — never noise.',
  },
];

export default function About() {
  return (
    <PageTransition>
      <section className="relative flex min-h-[70vh] flex-col justify-end overflow-hidden px-6 pb-20 pt-40 md:px-10">
        <InfinityBackground />
        <p className="eyebrow relative text-electric">About EON</p>
        <h1 className="font-display relative mt-4 max-w-4xl text-5xl font-medium leading-[1.02] md:text-8xl">
          A loop, not a line.
        </h1>
      </section>

      <section className="mx-auto grid max-w-[1600px] gap-10 border-t border-line px-6 py-20 md:grid-cols-2 md:px-10">
        <p className="font-display text-2xl leading-snug md:text-3xl">
          EON was built on a simple refusal: that fashion has to move in
          straight lines, from launch to landfill.
        </p>
        <div className="space-y-6 text-ink-soft leading-relaxed">
          <p>
            We design in loops instead. A silhouette introduced this year
            returns next year — sharper, better sourced, still recognizably
            itself. The infinity mark isn't a logo we bolted on; it's the
            operating principle. Nothing here is meant to expire.
          </p>
          <p>
            EON is made in small batches, cut from technical fabrics that
            hold their structure past the first wash, and finished with
            hardware that references the mark without shouting it. Cash on
            delivery, one WhatsApp line, no middlemen — the brand is small
            enough to still answer its own messages.
          </p>
        </div>
      </section>

      <section className="border-t border-line bg-ink py-24 text-bg">
        <div className="mx-auto max-w-[1600px] px-6 md:px-10">
          <p className="eyebrow text-electric">Principles</p>
          <div className="mt-10 grid gap-px overflow-hidden bg-ink-soft/20 md:grid-cols-3">
            {PILLARS.map((p, i) => (
              <div key={p.title} className="bg-ink p-10">
                <InfinityMark className="h-6 w-10 text-electric" strokeWidth={9} />
                <h3 className="font-display mt-6 text-xl font-medium">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-bg/70">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-24 text-center md:px-10">
        <p className="font-display text-3xl font-medium leading-snug md:text-5xl">
          Endless evolution, <span className="text-electric">worn.</span>
        </p>
      </section>
    </PageTransition>
  );
}
