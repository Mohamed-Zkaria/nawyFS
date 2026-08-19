import { getApartments } from "@/lib/api/apartments";
import { buildApartmentsHref } from "@/lib/utils/search-params";
import type { ApartmentsSearchParams } from "@/lib/utils/search-params";
import { ApartmentCard } from "@/components/apartments/ApartmentCard";
import { EmptyState } from "@/components/apartments/EmptyState";
import { ResultsSummary } from "@/components/apartments/ResultsSummary";
import { Pagination } from "@/components/apartments/Pagination";

export async function ApartmentGrid({ query }: { query: ApartmentsSearchParams }) {
  const { data, meta } = await getApartments(query);

  if (data.length === 0) {
    return (
      <>
        <ResultsSummary total={meta.total} search={query.search} />
        <EmptyState />
      </>
    );
  }

  return (
    <>
      <ResultsSummary total={meta.total} search={query.search} />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.map((apartment, index) => (
          <ApartmentCard key={apartment.id} apartment={apartment} preload={index < 4} />
        ))}
      </div>
      <Pagination meta={meta} buildHref={(page) => buildApartmentsHref(query, page)} />
    </>
  );
}
