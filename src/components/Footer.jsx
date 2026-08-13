import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="relative border-t border-line bg-bg">
      <div className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo size="text-3xl" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
              Endless evolution, worn. EON is a study in restraint — clean
              lines, electric detail, built to outlast trend cycles.
            </p>
          </div>

          <FooterCol
            title="Shop"
            links={[
              { label: 'Collection', to: '/collection' },
              { label: 'Size Guide', to: '/size-guide' },
              { label: 'Cart', to: '/cart' },
            ]}
          />
          <FooterCol
            title="Brand"
            links={[
              { label: 'About EON', to: '/about' },
              { label: 'Contact', to: '/contact' },
            ]}
          />
          <div>
            <p className="eyebrow text-gray-mid">Order via WhatsApp</p>
            <a
              href="https://wa.me/201103686261"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block font-mono text-sm text-ink underline decoration-electric decoration-2 underline-offset-4"
            >
              +20 110 368 6261
            </a>
            <p className="eyebrow mt-8 text-gray-mid">Payment</p>
            <p className="mt-2 text-sm text-ink-soft">Cash on Delivery only</p>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-line pt-8 text-xs text-gray-mid md:flex-row md:items-center">
          <p className="font-mono">© {new Date().getFullYear()} EON. All rights reserved.</p>
          <p className="eyebrow">Endless Collection ∞</p>
        </div>

        <div className="mt-6 flex flex-col items-start gap-2 text-xs text-gray-mid md:flex-row md:items-center md:gap-4">
          <p className="font-mono">Built by</p>
          <a
            href="https://wa.me/201067085956"
            target="_blank"
            rel="noreferrer"
            className="font-mono underline decoration-electric decoration-2 underline-offset-4 hover:text-electric"
          >
            Anas Basheer
          </a>
          <span className="hidden md:inline">&middot;</span>
          <a
            href="https://wa.me/201022133876"
            target="_blank"
            rel="noreferrer"
            className="font-mono underline decoration-electric decoration-2 underline-offset-4 hover:text-electric"
          >
            Mohamed Sherif
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <p className="eyebrow text-gray-mid">{title}</p>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              className="text-sm text-ink-soft transition-colors hover:text-electric"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
