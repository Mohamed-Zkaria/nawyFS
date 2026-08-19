export function GridSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse overflow-hidden rounded-card border border-border"
        >
          <div className="aspect-[4/3] bg-surface-muted" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 rounded bg-surface-muted" />
            <div className="h-4 w-2/3 rounded bg-surface-muted" />
            <div className="h-3 w-1/2 rounded bg-surface-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
