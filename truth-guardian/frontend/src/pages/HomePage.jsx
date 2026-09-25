import {
  ArrowRight,
  Bot,
  CheckCircle2,
  FileSearch,
  Flag,
  Link2,
  MessageCircle,
  SearchCheck,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import SystemStatus from '../components/SystemStatus';
import ContentHint from '../components/ui/ContentHint';
import FileDropzone, { getImageFileFromClipboard } from '../components/ui/FileDropzone';
import PasteButton from '../components/ui/PasteButton';
import { useToast } from '../components/ui/ToastProvider';

const principles = [
  {
    title: 'Evidence before conclusions',
    description: 'Results will explain supporting, conflicting and missing evidence in plain language.',
  },
  {
    title: 'Human review for serious claims',
    description: 'AI may assist analysis, while authorized people make high-impact publication decisions.',
  },
  {
    title: 'Non-partisan by design',
    description: 'The platform verifies claims without ranking parties, candidates or political actors.',
  },
];

const scamTips = [
  'Pause before opening unexpected payment or account links.',
  'Check the full sender details, not only a display name or logo.',
  'Treat urgent payment requests and promises of guaranteed returns as warning signs.',
  'Verify programmes, recruitment and scholarship claims through an official source.',
];

export default function HomePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [claim, setClaim] = useState('');
  const [file, setFile] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!claim.trim() && !file) {
      return;
    }

    navigate('/verify', {
      state: {
        initialText: claim.trim(),
        initialFile: file,
      },
    });
  };

  return (
    <>
      <section className="relative overflow-hidden bg-guardian-950 text-white">
        <div className="surface-grid absolute inset-0 opacity-40" aria-hidden="true" />
        <div
          className="absolute -right-36 top-12 h-96 w-96 rounded-full bg-guardian-500/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="page-shell relative grid min-h-[620px] items-center gap-12 py-14 sm:py-20 lg:min-h-[690px] lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-guardian-400/30 bg-guardian-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-guardian-200">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Public information service
              </span>
              <SystemStatus inverse />
               <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200">
                 No account required
               </span>
            </div>
            <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Verify Before You Share.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Check suspicious claims, government announcements, scams and online information using
              trusted sources.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-9 rounded-2xl border border-white/15 bg-white p-3 shadow-2xl shadow-black/20 sm:p-4"
            >
              <div className="flex items-center justify-between gap-3 px-1">
                <label htmlFor="claim" className="text-sm font-extrabold text-slate-800">
                  Message, claim or URL
                </label>
                <PasteButton
                  onPaste={(text) => {
                    setClaim(text);
                    showToast({ message: 'Clipboard text inserted.', type: 'success', duration: 2200 });
                  }}
                  onUnavailable={() => showToast({ message: "Clipboard access isn't available. You can paste manually using Ctrl+V.", type: 'warning' })}
                />
              </div>
              <textarea
                id="claim"
                value={claim}
                onChange={(event) => setClaim(event.target.value)}
                onPaste={(event) => {
                  const image = getImageFileFromClipboard(event.clipboardData);
                  if (image) {
                    event.preventDefault();
                    setFile(image);
                    showToast({ message: 'Screenshot attached. Review it before verifying.', type: 'info' });
                  }
                }}
                rows="4"
                placeholder="Paste a message, claim or URL"
                className="mt-2 w-full resize-none rounded-xl border-0 bg-slate-50 px-4 py-3 text-base text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-guardian-500"
              />
              <ContentHint value={claim} className="px-1" />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <FileDropzone
                  id="home-evidence"
                  value={file}
                  onChange={setFile}
                  onError={(message) => message && showToast({ message, type: 'error' })}
                  className="w-full sm:max-w-xs"
                  label="Drop a screenshot or document"
                  description="or choose a file"
                  hint="PNG, JPEG, WebP or PDF · 10 MB maximum"
                />
                <button
                  type="submit"
                  disabled={!claim.trim() && !file}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-guardian-800 px-6 py-3 text-sm font-extrabold text-white transition-[background-color,transform] hover:bg-guardian-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 sm:self-end"
                >
                  <SearchCheck className="h-5 w-5" aria-hidden="true" />
                  VERIFY
                </button>
              </div>
            </form>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              Public verification searches approved official records. If evidence is missing, Truth Guardian says so instead of inventing a verdict.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/truth-guardian"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
              >
                <Bot className="h-5 w-5 text-guardian-300" aria-hidden="true" />
                Chat with Truth Guardian
              </Link>
              <Link
                to="/report"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-guardian-200 hover:bg-white/5"
              >
                <Flag className="h-5 w-5" aria-hidden="true" />
                Report Suspicious Activity
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:ml-auto">
            <div className="absolute -inset-5 rounded-[2rem] bg-guardian-400/10 blur-2xl" aria-hidden="true" />
            <div className="relative rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur sm:p-7">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-guardian-300">
                    Evidence-based results
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-extrabold">Not just true or false</h2>
                </div>
                <FileSearch className="h-8 w-8 text-guardian-300" aria-hidden="true" />
              </div>
              <div className="mt-6 space-y-3">
                {[
                  ['Status', 'APPROVED MATERIAL FOUND · UNVERIFIED'],
                  ['Evidence strength', 'STRONG · MODERATE · LIMITED'],
                  ['Explanation', 'Why the available evidence supports or conflicts with the claim'],
                  ['Sources', 'Direct links to the official and trusted materials reviewed'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-black/10 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-guardian-300">
                      {label}
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-slate-200">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-start gap-3 rounded-xl bg-guardian-400/10 p-4 text-sm leading-6 text-guardian-100">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                Unknown domains are not automatically called malicious. Verification status and
                evidence remain separate.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="page-shell grid divide-y divide-slate-200 py-7 md:grid-cols-3 md:divide-x md:divide-y-0">
          {[
            [ShieldCheck, 'Trusted-source first'],
            [MessageCircle, 'Plain-language explanations'],
            [ShieldAlert, 'Human review checkpoints'],
          ].map(([Icon, label]) => (
            <div key={label} className="flex items-center justify-center gap-3 px-4 py-3 text-sm font-bold text-slate-700">
              <Icon className="h-5 w-5 text-guardian-600" aria-hidden="true" />
              {label}
            </div>
          ))}
        </div>
      </section>

      <section className="py-20">
        <div className="page-shell">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-guardian-700">Public information areas</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Public records will appear here only after verification and review.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Public records appear here only after verification and review. Citizen reports remain
              separate from authoritative information.
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <FileSearch className="h-7 w-7 text-guardian-700" aria-hidden="true" />
              <h3 className="mt-5 font-display text-xl font-extrabold">Latest verified information</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Official notices and reviewed public information will be searchable here.
              </p>
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                Browse the verified-information workspace for approved, currently valid official records.
                 <Link to="/verified-information" className="mt-3 inline-flex min-h-10 items-center font-extrabold text-guardian-800 hover:underline">
                   Browse approved records <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                 </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <ShieldAlert className="h-7 w-7 text-amber-600" aria-hidden="true" />
              <h3 className="mt-5 font-display text-xl font-extrabold">Latest public alerts</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Reviewed warnings about scams, impersonation and misinformation will appear here.
              </p>
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                No public alerts loaded.
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <Link2 className="h-7 w-7 text-blue-600" aria-hidden="true" />
              <h3 className="mt-5 font-display text-xl font-extrabold">Recent fact checks</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Claims, explanations, evidence, sources and timelines will be reviewed.
              </p>
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                No fact checks published.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="page-shell grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="rounded-3xl bg-guardian-950 p-8 text-white shadow-soft sm:p-10">
            <ShieldCheck className="h-10 w-10 text-guardian-300" aria-hidden="true" />
            <h2 className="mt-6 font-display text-3xl font-extrabold">How verification will work</h2>
            <div className="mt-7 space-y-5">
              {[
                ['1', 'Submit', 'Provide text, a link or a supported file.'],
                ['2', 'Review', 'The system retrieves evidence and shows its sources.'],
                ['3', 'Decide responsibly', 'A clear status explains uncertainty and limits.'],
              ].map(([number, title, description]) => (
                <div key={number} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-guardian-400/15 font-bold text-guardian-200">
                    {number}
                  </span>
                  <div>
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-8 border-t border-white/10 pt-5 text-xs leading-5 text-slate-400">
              The production pipeline will include content extraction, claim and entity extraction,
              source search, evidence comparison, assessment and citations.
            </p>
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-guardian-700">Our principles</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-slate-950">Trust requires visible evidence</h2>
            <div className="mt-7 space-y-4">
              {principles.map((principle) => (
                <div key={principle.title} className="flex gap-4 rounded-2xl border border-slate-200 p-5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-guardian-600" aria-hidden="true" />
                  <div>
                    <h3 className="font-bold text-slate-900">{principle.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{principle.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="page-shell grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card sm:p-10">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-rose-700">Report a scam</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-slate-950">Help protect your community</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
The reporting hub preserves reports in PostgreSQL first, even if optional evidence processing or Google Sheets synchronization is unavailable.
            </p>
            <Link
              to="/report"
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-rose-700"
            >
              Open reporting hub
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-100 p-8 sm:p-10">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">Scam education</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-slate-950">Pause. Check. Protect.</h2>
            <ul className="mt-6 space-y-3">
              {scamTips.map((tip) => (
                <li key={tip} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                  {tip}
                </li>
              ))}
            </ul>
            <Link to="/learn" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-800">
              Open learning centre
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
