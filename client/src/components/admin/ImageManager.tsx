'use client';

import { useActionState } from 'react';
import Image from 'next/image';
import type { ApartmentImage } from '@/lib/api/types';
import type { FormState } from '@/app/admin/_actions/apartments';

type AddImagesAction = (
  prevState: FormState,
  formData: FormData,
) => Promise<FormState>;

interface ImageManagerProps {
  images: ApartmentImage[];
  addAction: AddImagesAction;
  removeAction: (imageId: string) => Promise<void>;
}

const initialState: FormState = {};

export function ImageManager({ images, addAction, removeAction }: ImageManagerProps) {
  const [state, formAction, isPending] = useActionState(addAction, initialState);

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((image) => (
            <li key={image.id} className="space-y-2">
              <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-border bg-surface-muted">
                {/* Admin-supplied external URL — unoptimized, same reasoning
                    as ApartmentGallery/ApartmentCard. */}
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="160px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <form action={removeAction.bind(null, image.id)}>
                <button
                  type="submit"
                  className="w-full text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="space-y-2">
        <label htmlFor="imageUrls" className="block text-sm font-medium">
          Add image URLs (one per line)
        </label>
        <textarea
          id="imageUrls"
          name="imageUrls"
          rows={3}
          placeholder="https://example.com/photo1.jpg"
          className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="min-h-11 rounded-md border border-border px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {isPending ? 'Adding…' : 'Add images'}
        </button>
      </form>
    </div>
  );
}
