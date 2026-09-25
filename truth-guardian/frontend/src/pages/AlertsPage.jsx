import { BellRing, Mail, MessageSquareText } from 'lucide-react';

import FeaturePage from '../components/FeaturePage';

export default function AlertsPage() {
  return (
    <FeaturePage
      eyebrow="Public alerts"
      title="Warnings that help communities stay informed"
      description="Authorized administrators will publish reviewed warnings about phishing, impersonation, fake recruitment, scholarships, investment schemes and other verified threats. Notification delivery will be added only when real providers are configured."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {[
          [BellRing, 'Public alert feed', 'Severity, affected indicators, publication time and review status.'],
          [Mail, 'Email subscription', 'Planned opt-in delivery with unsubscribe and audit controls.'],
          [MessageSquareText, 'Other channels', 'SMS and WhatsApp delivery remain disabled until approved providers exist.'],
        ].map(([Icon, title, description]) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <Icon className="h-7 w-7 text-amber-600" aria-hidden="true" />
            <h2 className="mt-4 font-display text-xl font-extrabold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
        ))}
      </div>
    </FeaturePage>
  );
}
