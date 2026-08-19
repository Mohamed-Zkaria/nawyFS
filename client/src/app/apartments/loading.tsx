import { GridSkeleton } from "@/components/apartments/GridSkeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-16" />
      <div className="mt-6">
        <GridSkeleton />
      </div>
    </div>
  );
}
