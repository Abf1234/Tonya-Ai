import { ArrowRight } from 'lucide-react';

import Button from './Button';

export default function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = 'left',
  className = '',
}) {
  const centered = align === 'center';
  return (
    <div className={`${centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'} ${className}`}>
      {eyebrow ? (
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-guardian-700">{eyebrow}</p>
      ) : null}
      <div className={`mt-3 flex flex-col gap-4 ${centered ? 'items-center' : 'sm:flex-row sm:items-end sm:justify-between'}`}>
        <div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
          {description ? <p className="mt-4 text-base leading-7 text-slate-600">{description}</p> : null}
        </div>
        {action ? (
          <Button as="a" href={action.href} variant="secondary" className="shrink-0">
            {action.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
