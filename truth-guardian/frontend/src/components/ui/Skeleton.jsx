export default function Skeleton({ className = '', rounded = 'rounded-xl' }) {
  return (
    <span
      className={`skeleton block ${rounded} ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`} aria-label="Loading" role="status">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={index === lines - 1 ? 'w-3/5' : index % 2 ? 'w-11/12' : 'w-full'}
        />
      ))}
    </div>
  );
}
