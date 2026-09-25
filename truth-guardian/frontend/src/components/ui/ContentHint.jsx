import { Globe2, Mail, MessageCircle, Phone, Search } from 'lucide-react';

const patterns = [
  {
    key: 'url',
    label: 'URL detected',
    description: 'This looks like a link. A link alone is not a fraud verdict.',
    icon: Globe2,
    classes: 'border-blue-200 bg-blue-50 text-blue-800',
  },
  {
    key: 'email',
    label: 'Email detected',
    description: 'An email address is present. Check the full sender and destination.',
    icon: Mail,
    classes: 'border-violet-200 bg-violet-50 text-violet-800',
  },
  {
    key: 'phone',
    label: 'Phone number detected',
    description: 'A phone number is present. Do not share codes or payment details.',
    icon: Phone,
    classes: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  {
    key: 'message',
    label: 'Message pattern detected',
    description: 'This may be a suspicious message pattern—not a conclusion about fraud.',
    icon: MessageCircle,
    classes: 'border-rose-200 bg-rose-50 text-rose-800',
  },
  {
    key: 'claim',
    label: 'General claim detected',
    description: 'Truth Guardian will look for approved evidence and explain any limits.',
    icon: Search,
    classes: 'border-guardian-200 bg-guardian-50 text-guardian-900',
  },
];

export function detectContent(value) {
  const text = String(value || '').trim();
  if (!text) return [];

  const found = [];
  const hasUrl = /(?:https?:\/\/|www\.)\S+|\b[a-z0-9][a-z0-9-]+\.(?:com|org|net|gov|edu|sl)(?:[/?#]\S*)?/i.test(text);
  const hasEmail = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/.test(text);
  const hasPhone = /(?:\+?\d[\d\s().-]{7,}\d)/.test(text);
  const hasMessagePattern = /\b(urgent|wire transfer|send money|click here|one[- ]time code|otp|gift card|guaranteed returns?|account suspended|verify your account|investment|recruitment|scholarship)\b/i.test(text);

  if (hasUrl) found.push('url');
  if (hasEmail) found.push('email');
  if (hasPhone) found.push('phone');
  if (hasMessagePattern) found.push('message');
  if (!found.length) found.push('claim');

  return found.map((key) => patterns.find((pattern) => pattern.key === key)).filter(Boolean);
}

export default function ContentHint({ value, className = '', max = 3 }) {
  const detected = detectContent(value).slice(0, max);
  if (!value?.trim() || !detected.length) return null;

  return (
    <div className={`mt-3 flex flex-wrap items-center gap-2 ${className}`} aria-label="Detected content type">
      {detected.map((pattern) => {
        const Icon = pattern.icon;
        return (
          <span
            key={pattern.key}
            title={pattern.description}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-extrabold ${pattern.classes}`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {pattern.label}
          </span>
        );
      })}
      <span className="text-[11px] font-semibold text-slate-500">Pattern detection is a UI aid, not a verdict.</span>
    </div>
  );
}
