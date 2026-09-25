import { Link } from 'react-router-dom';

import Brand from './Brand';

const footerLinks = [
  { label: 'Verify information', to: '/verify' },
  { label: 'Report suspicious activity', to: '/report' },
  { label: 'Public alerts', to: '/alerts' },
  { label: 'Scam education', to: '/learn' },
  { label: 'About the platform', to: '/about' },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-guardian-950 text-slate-300">
      <div className="page-shell grid gap-10 py-12 md:grid-cols-[1.25fr_1fr]">
        <div className="max-w-md">
          <Brand inverse />
          <p className="mt-5 text-sm leading-6 text-slate-400">
            A non-partisan civic information platform designed to help people verify claims,
            understand trusted sources and report suspicious activity responsibly.
          </p>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-guardian-300">
            Verify Before You Share.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Platform</h2>
          <ul className="mt-4 grid gap-3 text-sm">
            {footerLinks.map((link) => (
              <li key={link.to}>
                <Link className="hover:text-guardian-300" to={link.to}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="page-shell flex flex-col gap-2 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Truth Guardian Sierra Leone.</p>
          <p>Evidence first. Human decisions for serious matters.</p>
        </div>
      </div>
    </footer>
  );
}
