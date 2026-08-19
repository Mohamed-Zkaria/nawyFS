import { Suspense } from "react";
import { getProjects } from "@/lib/api/projects";
import { parseApartmentsSearchParams } from "@/lib/utils/search-params";
import { SearchFilters } from "@/components/apartments/SearchFilters";
import { ApartmentGrid } from "@/components/apartments/ApartmentGrid";
import { GridSkeleton } from "@/components/apartments/GridSkeleton";

export default async function ApartmentsPage({ searchParams }: PageProps<"/apartments">) {
  const resolvedSearchParams = await searchParams;
  const query = parseApartmentsSearchParams(resolvedSearchParams);
  const projects = await getProjects();
  const suspenseKey = JSON.stringify(query);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="h-16" />}>
        <SearchFilters projects={projects} />
      </Suspense>
      <div className="mt-6">
        <Suspense key={suspenseKey} fallback={<GridSkeleton />}>
          <ApartmentGrid query={query} />
        </Suspense>
      </div>
    </div>
  );
}
