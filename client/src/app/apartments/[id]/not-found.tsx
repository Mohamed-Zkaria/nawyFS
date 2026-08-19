import Link from "next/link";

export default function ApartmentNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Apartment not found</h1>
      <p className="mt-2 text-foreground/70">
        This listing may have been removed or the link is incorrect.
      </p>
      <Link
        href="/apartments"
        className="mt-6 inline-block min-h-11 rounded-md bg-brand px-4 py-2 leading-[2.75rem] text-brand-foreground"
      >
        Back to listings
      </Link>
    </div>
  );
}
