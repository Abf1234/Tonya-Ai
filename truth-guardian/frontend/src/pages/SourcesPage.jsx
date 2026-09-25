import { Building2, Globe2, Radio, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import FeaturePage from '../components/FeaturePage';
import Alert from '../components/ui/Alert';
import Card from '../components/ui/Card';

export default function SourcesPage() {
  return (
    <FeaturePage
      eyebrow="Trusted sources"
      title="Verification starts with scoped trust"
      description="A source may be trusted for one subject area without being treated as universally authoritative. Every registry entry will record its organisation, domain, source type, scope, verification level, active state and review dates."
      showStatusNotice={false}
    >
      <Alert tone="info" title="Registry transparency matters" className="mb-5">
        Truth Guardian does not seed unverified example institutions or call a source official without registry evidence.
      </Alert>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {[
          [Building2, 'Official institutions', 'Government bodies, ministries, agencies and public offices.'],
          [Globe2, 'Official domains', 'Approved websites, domains and official account directories.'],
          [Radio, 'Scoped news sources', 'Trusted reporting with subject-specific review metadata.'],
          [ShieldCheck, 'Verification state', 'Active status, last check and last verification dates.'],
        ].map(([Icon, title, description]) => (
          <Card key={title} className="p-6" interactive>
            <Icon className="h-7 w-7 text-guardian-700" aria-hidden="true" />
            <h2 className="mt-4 font-display text-lg font-extrabold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-sm leading-6 text-slate-600">
        Browse the <Link className="font-extrabold text-guardian-800 hover:underline" to="/verified-information">verified information workspace</Link> for records that have passed the current public-record checks.
      </p>
    </FeaturePage>
  );
}
