"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import type { ProjectSummary } from "@/lib/api/types";

interface SearchFiltersProps {
  projects: ProjectSummary[];
}

const SORT_OPTIONS = [
  { value: "createdAt:DESC", label: "Newest first" },
  { value: "price:ASC", label: "Price: low to high" },
  { value: "price:DESC", label: "Price: high to low" },
  { value: "unitName:ASC", label: "Unit name: A–Z" },
] as const;

export function SearchFilters({ projects }: SearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(searchParams.get("search") ?? "");

  const currentSort = `${searchParams.get("sortBy") ?? "createdAt"}:${
    searchParams.get("sortOrder") ?? "DESC"
  }`;
  const currentProjectId = searchParams.get("projectId") ?? "";

  const applyParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      params.delete("page");
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const debouncedSearch = useDebouncedCallback((value: string) => {
    applyParams({ search: value.trim() || null });
  }, 300);

  return (
    <div
      className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-surface/95 py-4 backdrop-blur transition-opacity sm:flex-row sm:items-center"
      style={{ opacity: isPending ? 0.6 : 1 }}
    >
      <div className="flex-1">
        <label htmlFor="apartment-search" className="sr-only">
          Search by unit name, unit number, or project
        </label>
        <input
          id="apartment-search"
          type="search"
          placeholder="Search by unit name, unit number, or project…"
          value={searchValue}
          onChange={(event) => {
            setSearchValue(event.target.value);
            debouncedSearch(event.target.value);
          }}
          className="min-h-11 w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
        />
      </div>

      <div className="flex gap-3">
        <div>
          <label className="sr-only" htmlFor="apartment-project">
            Project
          </label>
          <select
            id="apartment-project"
            value={currentProjectId}
            onChange={(event) => applyParams({ projectId: event.target.value || null })}
            className="min-h-11 rounded-md border border-border bg-background px-3 py-2.5 text-sm"
          >
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="sr-only" htmlFor="apartment-sort">
            Sort by
          </label>
          <select
            id="apartment-sort"
            value={currentSort}
            onChange={(event) => {
              const [sortBy, sortOrder] = event.target.value.split(":");
              applyParams({ sortBy, sortOrder });
            }}
            className="min-h-11 rounded-md border border-border bg-background px-3 py-2.5 text-sm"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
