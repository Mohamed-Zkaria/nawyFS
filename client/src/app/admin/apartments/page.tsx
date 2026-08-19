import Link from 'next/link';
import { getApartments } from '@/lib/api/apartments';
import { deleteApartmentAction } from '@/app/admin/_actions/apartments';
import { formatPrice } from '@/lib/utils/format';

export default async function AdminApartmentsPage({
  searchParams,
}: PageProps<'/admin/apartments'>) {
  const resolved = await searchParams;
  const pageParam = Array.isArray(resolved.page) ? resolved.page[0] : resolved.page;
  const page = Math.max(1, Number(pageParam) || 1);

  const { data: apartments, meta } = await getApartments({
    page,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Apartments</h1>
        <Link
          href="/admin/apartments/new"
          className="min-h-11 rounded-md bg-brand px-4 py-2 text-sm font-medium leading-[2.75rem] text-brand-foreground"
        >
          New apartment
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-card border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-foreground/60">
            <tr>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Bed / Bath</th>
              <th className="px-4 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {apartments.map((apartment) => (
              <tr key={apartment.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{apartment.unitName}</div>
                  <div className="text-foreground/60">Unit {apartment.unitNumber}</div>
                </td>
                <td className="px-4 py-3">{apartment.projectName}</td>
                <td className="px-4 py-3">{formatPrice(apartment.price)}</td>
                <td className="px-4 py-3">
                  {apartment.bedrooms} bd · {apartment.bathrooms} ba
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/apartments/${apartment.id}/edit`}
                      className="text-brand hover:underline"
                    >
                      Edit
                    </Link>
                    <form action={deleteApartmentAction.bind(null, apartment.id)}>
                      <button type="submit" className="text-red-600 hover:underline">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {apartments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-foreground/60">
                  No apartments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-4 flex items-center justify-between text-sm"
        >
          <Link
            href={`/admin/apartments?page=${page - 1}`}
            aria-disabled={!meta.hasPreviousPage}
            className={
              meta.hasPreviousPage
                ? 'text-brand hover:underline'
                : 'pointer-events-none text-foreground/40'
            }
          >
            ← Previous
          </Link>
          <span className="text-foreground/60">
            Page {meta.page} of {meta.totalPages}
          </span>
          <Link
            href={`/admin/apartments?page=${page + 1}`}
            aria-disabled={!meta.hasNextPage}
            className={
              meta.hasNextPage
                ? 'text-brand hover:underline'
                : 'pointer-events-none text-foreground/40'
            }
          >
            Next →
          </Link>
        </nav>
      )}
    </div>
  );
}
