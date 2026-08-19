import { getProjects } from '@/lib/api/projects';
import { createApartmentAction } from '@/app/admin/_actions/apartments';
import { ApartmentForm } from '@/components/admin/ApartmentForm';

export default async function NewApartmentPage() {
  const projects = await getProjects();

  return (
    <div>
      <h1 className="text-2xl font-semibold">New apartment</h1>
      <div className="mt-6">
        <ApartmentForm
          action={createApartmentAction}
          projects={projects}
          submitLabel="Create apartment"
          includeImageUrls
        />
      </div>
    </div>
  );
}
