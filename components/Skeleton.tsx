// A single pulsing placeholder "bone" - compose several to sketch the shape
// of the real content so loading.tsx fallbacks don't cause layout shift when
// the actual page replaces them (see Next.js streaming docs on CLS).
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-black/10 dark:bg-white/10 ${className}`} />;
}
