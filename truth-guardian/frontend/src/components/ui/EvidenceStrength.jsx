import { BarChart3, CircleHelp, ShieldCheck, TriangleAlert } from 'lucide-react';

import Badge from './Badge';

const strengthConfig = {
  strong: {
    label: 'Strong evidence',
    shortLabel: 'Strong',
    icon: ShieldCheck,
    badge: 'success',
    bars: 4,
  },
  moderate: {
    label: 'Moderate evidence',
    shortLabel: 'Moderate',
    icon: BarChart3,
    badge: 'guardian',
    bars: 3,
  },
  limited: {
    label: 'Limited evidence',
    shortLabel: 'Limited',
    icon: TriangleAlert,
    badge: 'warning',
    bars: 2,
  },
  none: {
    label: 'No matching evidence',
    shortLabel: 'None',
    icon: CircleHelp,
    badge: 'neutral',
    bars: 0,
  },
};

export default function EvidenceStrength({ strength = 'none', compact = false, className = '' }) {
  const config = strengthConfig[String(strength || 'none').toLowerCase()] || strengthConfig.none;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Badge variant={config.badge} dot>{config.shortLabel}</Badge>
      {!compact ? (
        <div className="flex items-center gap-1" aria-label={`${config.label}: ${config.bars} of 4`}>
          {Array.from({ length: 4 }, (_, index) => (
            <span
              key={index}
              className={`h-1.5 w-5 rounded-full ${index < config.bars ? 'bg-current opacity-70' : 'bg-slate-200'}`}
              aria-hidden="true"
            />
          ))}
        </div>
      ) : null}
      {!compact ? <span className="text-xs font-bold text-slate-500">Evidence strength</span> : null}
      {!compact ? <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" /> : null}
    </div>
  );
}

export function VerificationStatus({ status = 'unverified', className = '' }) {
  const value = String(status || 'unverified').toLowerCase();
  const config = {
    evidence_found: { label: 'Evidence found', variant: 'success', icon: ShieldCheck },
    officially_confirmed: { label: 'Officially confirmed', variant: 'success', icon: ShieldCheck },
    supported: { label: 'Supported', variant: 'success', icon: ShieldCheck },
    no_evidence: { label: 'Unverified', variant: 'neutral', icon: CircleHelp },
    not_verified: { label: 'Unverified', variant: 'neutral', icon: CircleHelp },
    unverified: { label: 'Unverified', variant: 'neutral', icon: CircleHelp },
    insufficient_evidence: { label: 'Insufficient evidence', variant: 'warning', icon: CircleHelp },
    conflicting: { label: 'Conflicting information', variant: 'warning', icon: TriangleAlert },
    potential_scam: { label: 'Potential scam', variant: 'danger', icon: TriangleAlert },
  }[value] || { label: 'Unverified', variant: 'neutral', icon: CircleHelp };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={className}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {config.label}
    </Badge>
  );
}
