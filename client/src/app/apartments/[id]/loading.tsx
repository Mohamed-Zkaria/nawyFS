export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8" aria-hidden="true">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="aspect-[4/3] rounded-card bg-surface-muted" />
        <div className="h-64 rounded-card bg-surface-muted" />
      </div>
    </div>
  );
}
