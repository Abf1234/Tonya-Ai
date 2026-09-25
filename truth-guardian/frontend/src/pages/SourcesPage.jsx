import { Building2, Globe2, Radio, ShieldCheck } from 'lucide-react';

import FeaturePage from '../components/FeaturePage';

export default function SourcesPage() {
  return (
    <FeaturePage
      eyebrow="Trusted sources"
      title="Verification starts with scoped trust"
      description="A source may be trusted for one subject area without being treated as universally authoritative. Every registry entry will record its organisation, domain, source type, scope, verification level, active state and review dates."
    >
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {[
          [Building2, 'Official institutions', 'Government bodies, ministries, agencies and public offices.'],
          [Globe2, 'Official domains', 'Approved websites, domains and official account directories.'],
          [Radio, 'Scoped news sources', 'Trusted reporting with subject-specific review metadata.'],
          [ShieldCheck, 'Verification state', 'Active status, last check and last verification dates.'],
        ].map(([Icon, title, description]) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <Icon className="h-7 w-7 text-guardian-700" aria-hidden="true" />
            <h2 className="mt-4 font-display text-lg font-extrabold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm leading-6 text-slate-600">
        The phase-one interface does not seed unverified example institutions or claim that a source
        is official without registry evidence.
      </p>
    </FeaturePage>
  );
}
