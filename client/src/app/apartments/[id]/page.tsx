import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getApartmentById } from "@/lib/api/apartments";
import { ApiError } from "@/lib/api/errors";
import type { ApartmentDetail } from "@/lib/api/types";
import { ApartmentGallery } from "@/components/apartments/ApartmentGallery";
import { formatArea, formatPrice } from "@/lib/utils/format";

async function fetchApartmentOrNotFound(id: string): Promise<ApartmentDetail> {
  try {
    return await getApartmentById(id);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
      notFound();
    }
    throw error;
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/apartments/[id]">): Promise<Metadata> {
  const { id } = await params;
  try {
    const apartment = await getApartmentById(id);
    return {
      title: `${apartment.unitName} — ${apartment.projectName}`,
      description: apartment.description ?? undefined,
    };
  } catch {
    return { title: "Apartment" };
  }
}

export default async function ApartmentDetailPage({
  params,
}: PageProps<"/apartments/[id]">) {
  const { id } = await params;
  const apartment = await fetchApartmentOrNotFound(id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div>
          <ApartmentGallery images={apartment.images} unitName={apartment.unitName} />
          <article className="mt-6">
            <p className="text-sm font-medium uppercase tracking-wide text-foreground/60">
              {apartment.projectName}
            </p>
            <h1 className="mt-1 text-2xl font-semibold">{apartment.unitName}</h1>
            {apartment.description && (
              <p className="mt-4 text-foreground/80">{apartment.description}</p>
            )}
          </article>
        </div>
        <aside className="rounded-card border border-border p-6 lg:sticky lg:top-24 lg:h-fit">
          <p className="text-2xl font-semibold text-brand">{formatPrice(apartment.price)}</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-foreground/60">Unit number</dt>
              <dd>{apartment.unitNumber}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-foreground/60">Bedrooms</dt>
              <dd>{apartment.bedrooms}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-foreground/60">Bathrooms</dt>
              <dd>{apartment.bathrooms}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-foreground/60">Area</dt>
              <dd>{formatArea(apartment.areaSqm)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
