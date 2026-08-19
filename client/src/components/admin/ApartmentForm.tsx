'use client';

import { useActionState, useState } from 'react';
import type { ApartmentDetail } from '@/lib/api/types';
import type { ProjectSummary } from '@/lib/api/types';
import type { FormState } from '@/app/admin/_actions/apartments';

type ApartmentFormAction = (
  prevState: FormState,
  formData: FormData,
) => Promise<FormState>;

interface ApartmentFormProps {
  action: ApartmentFormAction;
  projects: ProjectSummary[];
  initial?: ApartmentDetail;
  submitLabel: string;
  includeImageUrls?: boolean;
}

const initialState: FormState = {};

export function ApartmentForm({
  action,
  projects,
  initial,
  submitLabel,
  includeImageUrls = false,
}: ApartmentFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [projectMode, setProjectMode] = useState<'existing' | 'new'>(
    initial && !projects.some((p) => p.id === initial.projectId) ? 'new' : 'existing',
  );

  return (
    <form action={formAction} className="max-w-2xl space-y-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Unit name" htmlFor="unitName">
          <input
            id="unitName"
            name="unitName"
            required
            minLength={2}
            maxLength={120}
            defaultValue={initial?.unitName}
            className={inputClass}
          />
        </Field>
        <Field label="Unit number" htmlFor="unitNumber">
          <input
            id="unitNumber"
            name="unitNumber"
            required
            maxLength={40}
            defaultValue={initial?.unitNumber}
            className={inputClass}
          />
        </Field>
      </div>

      <fieldset className="space-y-3 rounded-card border border-border p-4">
        <legend className="px-1 text-sm font-medium">Project</legend>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="projectMode"
              value="existing"
              checked={projectMode === 'existing'}
              onChange={() => setProjectMode('existing')}
            />
            Existing project
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="projectMode"
              value="new"
              checked={projectMode === 'new'}
              onChange={() => setProjectMode('new')}
            />
            New project
          </label>
        </div>

        {projectMode === 'existing' ? (
          <select
            name="projectId"
            required={projectMode === 'existing'}
            defaultValue={initial?.projectId}
            className={inputClass}
          >
            <option value="" disabled>
              Select a project…
            </option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} ({project.city})
              </option>
            ))}
          </select>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="projectName"
              placeholder="Project name"
              required={projectMode === 'new'}
              minLength={2}
              maxLength={120}
              className={inputClass}
            />
            <input
              name="projectCity"
              placeholder="City"
              required={projectMode === 'new'}
              maxLength={120}
              className={inputClass}
            />
          </div>
        )}
      </fieldset>

      <Field label="Description" htmlFor="description">
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={4000}
          defaultValue={initial?.description ?? ''}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Price" htmlFor="price">
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={initial?.price}
            className={inputClass}
          />
        </Field>
        <Field label="Bedrooms" htmlFor="bedrooms">
          <input
            id="bedrooms"
            name="bedrooms"
            type="number"
            min={0}
            max={20}
            required
            defaultValue={initial?.bedrooms}
            className={inputClass}
          />
        </Field>
        <Field label="Bathrooms" htmlFor="bathrooms">
          <input
            id="bathrooms"
            name="bathrooms"
            type="number"
            min={0}
            required
            defaultValue={initial?.bathrooms}
            className={inputClass}
          />
        </Field>
        <Field label="Area (sqm)" htmlFor="areaSqm">
          <input
            id="areaSqm"
            name="areaSqm"
            type="number"
            min={0.01}
            step="0.01"
            required
            defaultValue={initial?.areaSqm}
            className={inputClass}
          />
        </Field>
      </div>

      {includeImageUrls && (
        <Field label="Image URLs (one per line)" htmlFor="imageUrls">
          <textarea
            id="imageUrls"
            name="imageUrls"
            rows={3}
            placeholder="https://example.com/photo1.jpg"
            className={inputClass}
          />
        </Field>
      )}

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="min-h-11 rounded-md bg-brand px-5 py-2 text-sm font-medium text-brand-foreground disabled:opacity-60"
      >
        {isPending ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}

const inputClass =
  'mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand';

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
