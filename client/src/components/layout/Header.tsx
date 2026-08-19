import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <Link href="/apartments" className="text-lg font-semibold">
          Nawy Apartments
        </Link>
      </div>
    </header>
  );
}
