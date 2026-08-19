import 'server-only';
import { apiFetch } from '@/lib/api/http';
import type { ProjectSummary } from '@/lib/api/types';

export async function getProjects(): Promise<ProjectSummary[]> {
  const { data } = await apiFetch<ProjectSummary[]>('/projects');
  return data;
}
