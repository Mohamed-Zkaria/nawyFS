export function EmptyState() {
  return (
    <div
      role="status"
      className="rounded-card border border-dashed border-border p-12 text-center"
    >
      <p className="text-base font-medium">No apartments match your search.</p>
      <p className="mt-1 text-sm text-foreground/60">
        Try a different unit name, unit number, or project.
      </p>
    </div>
  );
}
