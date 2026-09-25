import { Link } from 'react-router-dom';
import guardianMark from '../assets/guardian-mark.svg';

export default function Brand({ inverse = false, compact = false }) {
  return (
    <Link
      to="/"
      className="group inline-flex items-center gap-3 rounded-lg"
      aria-label="Truth Guardian Sierra Leone home"
    >
      <img
        src={guardianMark}
        alt=""
        width="44"
        height="44"
        className="h-10 w-10 rounded-xl shadow-sm transition-transform motion-safe:group-hover:-translate-y-0.5"
      />
      <span className={compact ? 'hidden sm:block' : ''}>
        <span
          className={`block font-display text-sm font-extrabold leading-tight tracking-tight ${
            inverse ? 'text-white' : 'text-guardian-950'
          }`}
        >
          TRUTH GUARDIAN
        </span>
        <span
          className={`block text-[0.67rem] font-semibold uppercase tracking-[0.18em] ${
            inverse ? 'text-guardian-200' : 'text-guardian-700'
          }`}
        >
          Sierra Leone
        </span>
      </span>
    </Link>
  );
}
