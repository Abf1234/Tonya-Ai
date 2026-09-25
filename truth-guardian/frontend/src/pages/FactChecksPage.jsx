import { CalendarDays, FileText, Gavel, Link2 } from 'lucide-react';

import FeaturePage from '../components/FeaturePage';

export default function FactChecksPage() {
  return (
    <FeaturePage
      eyebrow="Fact checks"
      title="Claims, evidence and corrections in context"
      description="Each future fact check will separate the original claim from verified facts, show the status and evidence strength, explain disagreements, link to direct sources, and preserve a timeline of major developments."
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [FileText, 'Claim', 'Exact wording and context'],
            [CalendarDays, 'Date', 'Publication and review dates'],
            [Gavel, 'Assessment', 'Status and reasoning'],
            [Link2, 'Sources', 'Direct supporting evidence'],
          ].map(([Icon, label, description]) => (
            <div key={label} className="rounded-xl bg-slate-50 p-4">
              <Icon className="h-5 w-5 text-guardian-700" aria-hidden="true" />
              <h2 className="mt-3 text-sm font-extrabold text-slate-900">{label}</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
          No fact checks have been loaded because the review and publication backend is not yet implemented.
        </div>
      </div>
    </FeaturePage>
  );
}
