'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api/http';
import { ApiError } from '@/lib/api/errors';
import { getSessionToken } from '@/lib/auth/session';
import type { ApartmentDetail } from '@/lib/api/types';

export interface FormState {
  error?: string;
}

async function requireToken(): Promise<string> {
  const token = await getSessionToken();
  if (!token) throw new Error('Not authenticated');
  return token;
}

function parseImageUrls(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildApartmentPayload(formData: FormData): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    unitName: formData.get('unitName'),
    unitNumber: formData.get('unitNumber'),
    description: formData.get('description') || undefined,
    price: Number(formData.get('price')),
    bedrooms: Number(formData.get('bedrooms')),
    bathrooms: Number(formData.get('bathrooms')),
    areaSqm: Number(formData.get('areaSqm')),
  };

  if (formData.get('projectMode') === 'existing') {
    payload.projectId = formData.get('projectId');
  } else {
    payload.projectName = formData.get('projectName');
    payload.projectCity = formData.get('projectCity');
  }

  return payload;
}

export async function createApartmentAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = await requireToken();
  const payload = buildApartmentPayload(formData);

  let apartment: ApartmentDetail;
  try {
    const res = await apiFetch<ApartmentDetail>('/apartments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    apartment = res.data;
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : 'Failed to create apartment.',
    };
  }

  const imageUrls = parseImageUrls(formData.get('imageUrls'));
  if (imageUrls.length > 0) {
    try {
      await apiFetch(`/apartments/${apartment.id}/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ urls: imageUrls }),
      });
    } catch {
      // The apartment itself was created successfully; a failed image URL
      // isn't fatal here — the admin can retry from the edit page, where
      // failures are surfaced per-attempt instead of rolling back a create.
    }
  }

  revalidatePath('/apartments');
  revalidatePath('/admin/apartments');
  redirect(`/admin/apartments/${apartment.id}/edit`);
}

export async function updateApartmentAction(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = await requireToken();
  const payload = buildApartmentPayload(formData);

  try {
    await apiFetch(`/apartments/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : 'Failed to update apartment.',
    };
  }

  revalidatePath('/apartments');
  revalidatePath(`/apartments/${id}`);
  revalidatePath('/admin/apartments');
  revalidatePath(`/admin/apartments/${id}/edit`);
  return {};
}

export async function deleteApartmentAction(id: string): Promise<void> {
  const token = await requireToken();

  await apiFetch(`/apartments/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  revalidatePath('/apartments');
  revalidatePath('/admin/apartments');
  redirect('/admin/apartments');
}

export async function addImagesAction(
  apartmentId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = await requireToken();
  const urls = parseImageUrls(formData.get('imageUrls'));
  if (urls.length === 0) {
    return { error: 'Enter at least one image URL.' };
  }

  try {
    await apiFetch(`/apartments/${apartmentId}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ urls }),
    });
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : 'Failed to add images.',
    };
  }

  revalidatePath('/apartments');
  revalidatePath(`/apartments/${apartmentId}`);
  revalidatePath(`/admin/apartments/${apartmentId}/edit`);
  return {};
}

export async function removeImageAction(
  apartmentId: string,
  imageId: string,
): Promise<void> {
  const token = await requireToken();

  await apiFetch(`/apartments/${apartmentId}/images/${imageId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  revalidatePath('/apartments');
  revalidatePath(`/apartments/${apartmentId}`);
  revalidatePath(`/admin/apartments/${apartmentId}/edit`);
}
