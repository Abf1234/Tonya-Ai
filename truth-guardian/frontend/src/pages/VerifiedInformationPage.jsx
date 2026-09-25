import { BadgeCheck, Bell, FileSearch, Search } from 'lucide-react';

import FeaturePage from '../components/FeaturePage';

export default function VerifiedInformationPage() {
  return (
    <FeaturePage
      eyebrow="Verified information"
      title="Authoritative public information, made searchable"
      description="The future information library will index approved government announcements, official notices, public warnings, reviewed fact checks and scam alerts, while preserving source scope and verification dates."
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
        <div className="flex max-w-2xl items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-400">
          <Search className="h-5 w-5" aria-hidden="true" />
          <span>Search becomes available when the trusted-source registry is connected.</span>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            [BadgeCheck, 'Verified status', 'Scope, verification level and date remain visible.'],
            [FileSearch, 'Indexed documents', 'Official documents and public notices remain searchable.'],
            [Bell, 'Public warnings', 'Reviewed alerts can link back to their evidence.'],
          ].map(([Icon, title, description]) => (
            <div key={title} className="rounded-xl border border-slate-200 p-4">
              <Icon className="h-5 w-5 text-guardian-700" aria-hidden="true" />
              <h2 className="mt-3 font-extrabold">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </FeaturePage>
  );
}
