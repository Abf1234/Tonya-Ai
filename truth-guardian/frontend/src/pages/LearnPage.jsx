import { BookOpenCheck, Languages, RadioTower, Smartphone } from 'lucide-react';

import FeaturePage from '../components/FeaturePage';

export default function LearnPage() {
  return (
    <FeaturePage
      eyebrow="Learning centre"
      title="Build the habit of checking before sharing"
      description="Future guidance will cover impersonation, phishing, fake recruitment, scholarships, mobile-money fraud, investment schemes, misinformation and safer evidence handling. The platform will remain educational and non-partisan."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {[
          [BookOpenCheck, 'Practical scam guidance', 'Short, accessible lessons designed for citizens, journalists and public servants.'],
          [Smartphone, 'Safer sharing', 'How to inspect links, sender details, urgency and payment requests.'],
          [RadioTower, 'Official announcements', 'How to trace a claim back to the responsible institution and scope.'],
          [Languages, 'Local language roadmap', 'English is the initial language, with Krio, Mende, Temne and Limba prepared for validated content and evaluation.'],
        ].map(([Icon, title, description]) => (
          <div key={title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <Icon className="mt-1 h-6 w-6 shrink-0 text-guardian-700" aria-hidden="true" />
            <div>
              <h2 className="font-display text-xl font-extrabold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </FeaturePage>
  );
}
