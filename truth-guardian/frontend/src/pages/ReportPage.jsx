import { FileLock2, Flag, ShieldCheck, Users } from 'lucide-react';

import FeaturePage from '../components/FeaturePage';

const categories = [
  'Fraud',
  'Phishing',
  'Impersonation',
  'Fake Government Announcement',
  'Fake Scholarship',
  'Fake Recruitment',
  'Fake Investment',
  'Mobile Money Fraud',
  'Social Media Scam',
  'Misinformation',
  'Other',
];

export default function ReportPage() {
  return (
    <FeaturePage
      eyebrow="Reporting hub"
      title="Report fraud or suspicious information"
      description="The production workflow will accept reports safely, save them to PostgreSQL first, return a report number, and then synchronize selected operational fields to Google Sheets through a background worker. A Google Sheets outage must never prevent a successful PostgreSQL submission."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
          <Flag className="h-7 w-7 text-rose-700" aria-hidden="true" />
          <h2 className="mt-4 font-display text-2xl font-extrabold">Planned report categories</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((category) => (
              <span key={category} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
                {category}
              </span>
            ))}
          </div>
          <button
            type="button"
            disabled
            className="mt-7 cursor-not-allowed rounded-lg bg-slate-300 px-5 py-3 text-sm font-extrabold text-white"
          >
            Reporting is not open in Phase 1
          </button>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <FileLock2 className="h-6 w-6 text-guardian-700" aria-hidden="true" />
            <h2 className="mt-3 font-extrabold">PostgreSQL is authoritative</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Report data will be committed before optional synchronization begins. Private reporter
              details will never appear in public similar-report results.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <Users className="h-6 w-6 text-blue-700" aria-hidden="true" />
            <h2 className="mt-3 font-extrabold">Human review</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              AI clustering and summaries can assist authorized staff, but publication and serious
              allegations remain human decisions.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-guardian-950 p-6 text-white">
            <ShieldCheck className="h-6 w-6 text-guardian-300" aria-hidden="true" />
            <h2 className="mt-3 font-extrabold">Do not submit passwords or payment PINs</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Remove secrets from screenshots when possible. Evidence upload validation and access controls will be enforced server-side.
            </p>
          </div>
        </div>
      </div>
    </FeaturePage>
  );
}
