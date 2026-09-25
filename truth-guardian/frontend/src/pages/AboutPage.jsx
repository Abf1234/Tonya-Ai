import { BookOpenCheck, Scale, ShieldCheck, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';

const principles = [
  {
    icon: Scale,
    title: 'Non-partisan',
    text: 'Truth Guardian does not rank candidates, parties or political actors and does not provide political persuasion.',
  },
  {
    icon: BookOpenCheck,
    title: 'Evidence visible',
    text: 'Claims and facts are separated. Results are expected to show direct sources, disagreements, evidence strength and limitations.',
  },
  {
    icon: UsersRound,
    title: 'Human responsibility',
    text: 'AI can assist authorized analysts, while people make decisions about serious allegations, officials, emergencies and major schemes.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy aware',
    text: 'Private reporter information must not appear in public duplicate searches, intelligence views or AI summaries.',
  },
];

export default function AboutPage() {
  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-guardian-950 py-20 text-white">
        <div className="surface-grid absolute inset-0 opacity-30" aria-hidden="true" />
        <div className="page-shell relative">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-guardian-300">About Truth Guardian</p>
          <h1 className="mt-5 max-w-4xl font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Information verification for the public good
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Truth Guardian Sierra Leone is designed as a trusted civic-tech service for citizens,
            journalists, public servants, authorized officials and organizations. Its purpose is to
            help people understand evidence—not to tell them what to think.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="page-shell grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-guardian-700">Our commitment</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-slate-950">Verify Before You Share.</h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              The platform separates authoritative evidence from operational and administrative
              systems so that the same APIs can support the public website and future clients without
              duplicating business rules.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {principles.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <Icon className="h-6 w-6 text-guardian-700" aria-hidden="true" />
                <h3 className="mt-4 font-display text-xl font-extrabold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16">
        <div className="page-shell grid gap-8 md:grid-cols-3">
          {[
            ['01', 'Submit', 'A person provides a claim, URL, screenshot, document or fraud report.'],
            ['02', 'Analyze', 'Backend services extract content, search scoped evidence and compare sources.'],
            ['03', 'Review', 'The platform shows evidence and uncertainty; authorized people govern serious publication decisions.'],
          ].map(([number, title, text]) => (
            <div key={number} className="rounded-2xl bg-white p-6 shadow-card">
              <span className="text-xs font-extrabold tracking-[0.2em] text-guardian-700">{number}</span>
              <h2 className="mt-4 font-display text-2xl font-extrabold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20">
        <div className="page-shell rounded-3xl bg-guardian-900 p-8 text-white shadow-soft sm:p-12">
          <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-extrabold">Start with a cautious check</h2>
              <p className="mt-3 text-base leading-7 text-guardian-100">
                Public verification currently searches approved, currently valid official records. Richer
                extraction, AI analysis and operational integrations remain explicitly marked as unavailable
                rather than simulated.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/verify" className="rounded-lg bg-white px-5 py-3 text-sm font-extrabold text-guardian-900">
                Open Verify
              </Link>
              <Link to="/learn" className="rounded-lg border border-white/25 px-5 py-3 text-sm font-extrabold text-white">
                Learn the basics
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
