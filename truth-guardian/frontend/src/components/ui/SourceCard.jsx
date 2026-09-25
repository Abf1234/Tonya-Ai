import { ExternalLink, FileText, ShieldCheck } from 'lucide-react';

import Badge from './Badge';

function formatDate(value) {
  if (!value) return 'Date not supplied';
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export default function SourceCard({ source = {}, className = '', compact = false }) {
  const explicitlyVerified =
    source.is_verified === true ||
    source.verified === true ||
    ['approved', 'approved_official', 'verified'].includes(String(source.verification_status || '').toLowerCase());
  const sourceType = source.source_type || source.category || 'Official record';
  const hasLink = Boolean(source.source_url);

  return (
    <article className={`rounded-2xl border border-slate-200 bg-white p-4 transition-[border-color,box-shadow,transform] duration-200 hover:border-guardian-300 hover:shadow-card ${className}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-guardian-50 text-guardian-700">
          <FileText className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="font-extrabold leading-6 text-slate-900">{source.title || 'Untitled source record'}</h3>
            <Badge variant={explicitlyVerified ? 'success' : 'neutral'}>
              {explicitlyVerified ? <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> : null}
              {explicitlyVerified ? 'Verified source' : 'Source record'}
            </Badge>
          </div>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
            {source.institution || 'Institution not supplied'}
            {source.institution_acronym ? ` · ${source.institution_acronym}` : ''}
            {' · '}{sourceType}
          </p>
        </div>
      </div>
      {!compact && source.excerpt ? <p className="mt-3 text-sm leading-6 text-slate-600">{source.excerpt}</p> : null}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
        <span>Published: {formatDate(source.publication_date || source.published_at)}</span>
        {hasLink ? (
          <a
            href={source.source_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-8 items-center gap-1 font-extrabold text-guardian-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guardian-500"
          >
            Open original source
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </article>
  );
}
