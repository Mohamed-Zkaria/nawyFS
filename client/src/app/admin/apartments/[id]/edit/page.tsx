import { notFound } from 'next/navigation';
import { getApartmentById } from '@/lib/api/apartments';
import { getProjects } from '@/lib/api/projects';
import {
  addImagesAction,
  deleteApartmentAction,
  removeImageAction,
  updateApartmentAction,
} from '@/app/admin/_actions/apartments';
import { ApartmentForm } from '@/components/admin/ApartmentForm';
import { ImageManager } from '@/components/admin/ImageManager';
import { ApiError } from '@/lib/api/errors';

export default async function EditApartmentPage({
  params,
}: PageProps<'/admin/apartments/[id]/edit'>) {
  const { id } = await params;
  const projects = await getProjects();

  let apartment;
  try {
    apartment = await getApartmentById(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Edit apartment</h1>
        <div className="mt-6">
          <ApartmentForm
            action={updateApartmentAction.bind(null, id)}
            projects={projects}
            initial={apartment}
            submitLabel="Save changes"
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Images</h2>
        <div className="mt-4">
          <ImageManager
            images={apartment.images}
            addAction={addImagesAction.bind(null, id)}
            removeAction={removeImageAction.bind(null, id)}
          />
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h2 className="text-lg font-semibold text-red-600">Danger zone</h2>
        <form action={deleteApartmentAction.bind(null, id)} className="mt-3">
          <button
            type="submit"
            className="min-h-11 rounded-md border border-red-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Delete apartment
          </button>
        </form>
      </div>
    </div>
  );
}
