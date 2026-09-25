export default function PageTransition({ children, className = '' }) {
  return <div className={`animate-fade-up ${className}`}>{children}</div>;
}
