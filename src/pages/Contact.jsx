import { useState } from 'react';
import PageTransition from '../components/PageTransition';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = `Hi EON, my name is ${form.name}.\n\n${form.message}\n\n(Reply to: ${form.email})`;
    window.open(
      `https://wa.me/201103686261?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    );
    setSent(true);
    setForm({ name: '', email: '', message: '' });
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <PageTransition>
      <section className="mx-auto max-w-[1600px] px-6 pt-36 pb-24 md:px-10">
        <div className="grid gap-16 md:grid-cols-2">
          <div>
            <p className="eyebrow text-electric">Get in Touch</p>
            <h1 className="font-display mt-4 text-5xl font-medium leading-[1.02] md:text-6xl">
              Talk to EON
            </h1>
            <p className="mt-6 max-w-sm text-ink-soft leading-relaxed">
              Questions about fit, an order, or a collaboration — send a
              message and it routes straight to our WhatsApp line.
            </p>

            <div className="mt-12 space-y-8">
              <div>
                <p className="eyebrow text-gray-mid">WhatsApp</p>
                <a
                  href="https://wa.me/201103686261"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono mt-2 block text-lg text-ink hover:text-electric"
                >
                  +20 110 368 6261
                </a>
              </div>
              <div>
                <p className="eyebrow text-gray-mid">Studio</p>
                <p className="mt-2 text-ink-soft">Cairo, Egypt</p>
              </div>
              <div>
                <p className="eyebrow text-gray-mid">Hours</p>
                <p className="mt-2 text-ink-soft">Sun – Thu, 10:00 – 18:00 EET</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="border border-line p-8 md:p-10">
            <div>
              <label className="eyebrow text-gray-mid" htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="mt-2 w-full border-b border-line bg-transparent py-3 outline-none focus:border-electric"
              />
            </div>
            <div className="mt-6">
              <label className="eyebrow text-gray-mid" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="mt-2 w-full border-b border-line bg-transparent py-3 outline-none focus:border-electric"
              />
            </div>
            <div className="mt-6">
              <label className="eyebrow text-gray-mid" htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={4}
                className="mt-2 w-full resize-none border-b border-line bg-transparent py-3 outline-none focus:border-electric"
              />
            </div>
            <button
              type="submit"
              className="eyebrow mt-8 w-full bg-ink py-4 text-bg transition-opacity hover:opacity-85"
            >
              {sent ? 'Opening WhatsApp…' : 'Send via WhatsApp'}
            </button>
          </form>
        </div>
      </section>
    </PageTransition>
  );
}
