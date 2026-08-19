interface ResultsSummaryProps {
  total: number;
  search?: string;
}

export function ResultsSummary({ total, search }: ResultsSummaryProps) {
  return (
    <p role="status" aria-live="polite" className="mb-4 text-sm text-foreground/70">
      {total} {total === 1 ? "apartment" : "apartments"}
      {search ? ` matching "${search}"` : ""}
    </p>
  );
}
