"use client";

export default function ApartmentsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div role="alert" className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-foreground/70">
        We couldn&apos;t load the apartments. Please try again.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 min-h-11 rounded-md bg-brand px-4 py-2 text-brand-foreground"
      >
        Try again
      </button>
    </div>
  );
}
