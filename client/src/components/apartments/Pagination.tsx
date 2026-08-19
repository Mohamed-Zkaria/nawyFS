import Link from "next/link";
import type { PaginationMeta } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

interface PaginationProps {
  meta: PaginationMeta;
  buildHref: (page: number) => string;
}

export function Pagination({ meta, buildHref }: PaginationProps) {
  if (meta.totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-2">
      <Link
        href={buildHref(meta.page - 1)}
        aria-disabled={!meta.hasPreviousPage}
        tabIndex={meta.hasPreviousPage ? undefined : -1}
        className={cn(
          "min-h-11 rounded-md border border-border px-4 py-2 text-sm",
          !meta.hasPreviousPage && "pointer-events-none opacity-40",
        )}
      >
        Previous
      </Link>
      <span className="px-2 text-sm text-foreground/70">
        Page {meta.page} of {meta.totalPages}
      </span>
      <Link
        href={buildHref(meta.page + 1)}
        aria-disabled={!meta.hasNextPage}
        tabIndex={meta.hasNextPage ? undefined : -1}
        className={cn(
          "min-h-11 rounded-md border border-border px-4 py-2 text-sm",
          !meta.hasNextPage && "pointer-events-none opacity-40",
        )}
      >
        Next
      </Link>
    </nav>
  );
}
