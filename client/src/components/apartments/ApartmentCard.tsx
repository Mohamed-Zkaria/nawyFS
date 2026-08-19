import Image from "next/image";
import Link from "next/link";
import type { ApartmentSummary } from "@/lib/api/types";
import { formatArea, formatPrice } from "@/lib/utils/format";

interface ApartmentCardProps {
  apartment: ApartmentSummary;
  preload?: boolean;
}

export function ApartmentCard({ apartment, preload = false }: ApartmentCardProps) {
  return (
    <Link
      href={`/apartments/${apartment.id}`}
      className="group block overflow-hidden rounded-card border border-border bg-surface transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-muted">
        <Image
          src={apartment.coverImageUrl ?? "/apartment-placeholder.svg"}
          alt={`${apartment.unitName} — ${apartment.projectName}`}
          fill
          sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
          className="object-cover transition duration-300 group-hover:scale-105"
          preload={preload}
        />
      </div>
      <div className="space-y-1 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">
          {apartment.projectName}
        </p>
        <h3 className="text-base font-semibold">{apartment.unitName}</h3>
        <p className="text-sm text-foreground/70">
          Unit {apartment.unitNumber} · {apartment.bedrooms} bd ·{" "}
          {apartment.bathrooms} ba · {formatArea(apartment.areaSqm)}
        </p>
        <p className="text-lg font-semibold text-brand">
          {formatPrice(apartment.price)}
        </p>
      </div>
    </Link>
  );
}
