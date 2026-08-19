import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthenticatedUser } from '@/lib/auth/current-user';
import { logoutAction } from '@/app/admin/actions';

export default async function AdminLayout({
  children,
}: LayoutProps<'/admin'>) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'admin') redirect('/login');

  return (
    <div>
      <div className="border-b border-border bg-surface-muted">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <nav
            className="flex gap-4 text-sm font-medium"
            aria-label="Admin navigation"
          >
            <Link href="/admin/apartments" className="hover:text-brand">
              Apartments
            </Link>
            <Link href="/admin/apartments/new" className="hover:text-brand">
              New apartment
            </Link>
          </nav>
          <form action={logoutAction}>
            <button
              type="submit"
              className="min-h-11 text-sm text-foreground/70 hover:text-foreground"
            >
              Log out ({user.email})
            </button>
          </form>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
