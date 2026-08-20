export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-label="Loading"
      className={`inline-block h-3.5 w-3.5 rounded-full border-2 border-black/20 dark:border-white/20 border-t-black/60 dark:border-t-white/60 animate-spin ${className}`}
    />
  );
}
