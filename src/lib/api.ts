/**
 * api.ts
 * ----------------------------------------------------------------------------
 * Cliente del backend serverless (/api). Reemplaza al viejo mockProjectStore:
 * ahora los datos viven en el servidor (Vercel KV), así el link del cliente
 * muestra el proyecto REAL desde cualquier dispositivo.
 *
 * El token de admin (si el backend lo exige) se guarda en localStorage y se
 * manda en el header `x-pt-admin` de las escrituras.
 * ----------------------------------------------------------------------------
 */

import type { Milestone, ProjectData } from '@/features/project-tracker';

export interface ProgressSummary {
  total: number;
  completed: number;
  percent: number;
}

export interface ProjectSummary {
  slug: string;
  clientName: string;
  projectName: string;
  projectId: string;
  updatedAt: string;
  progress: ProgressSummary;
}

export interface HealthInfo {
  ok: boolean;
  storage: 'kv' | 'memory';
  protected: boolean;
}

const ADMIN_TOKEN_KEY = 'pt_admin_token';

export function getAdminToken(): string {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setAdminToken(token: string): void {
  try {
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
    else localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    /* sin localStorage: el header simplemente no se manda */
  }
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { admin?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  if (init.admin) {
    const token = getAdminToken();
    if (token) headers.set('x-pt-admin', token);
  }

  const res = await fetch(`/api${path}`, { ...init, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, data?.error || `Error ${res.status}`);
  }
  return data as T;
}

export { ApiError };

export function getHealth(): Promise<HealthInfo> {
  return request<HealthInfo>('/health');
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const { projects } = await request<{ projects: ProjectSummary[] }>('/projects');
  return projects;
}

export async function createProject(input: {
  clientName: string;
  projectName: string;
}): Promise<ProjectData> {
  const { project } = await request<{ project: ProjectData }>('/projects', {
    method: 'POST',
    admin: true,
    body: JSON.stringify(input),
  });
  return project;
}

/** Devuelve el proyecto, o `null` si el slug no existe (404). */
export async function getProject(slug: string): Promise<ProjectData | null> {
  try {
    const { project } = await request<{ project: ProjectData }>(
      `/projects/${encodeURIComponent(slug)}`,
    );
    return project;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function saveProject(
  slug: string,
  patch: Partial<Pick<ProjectData, 'clientName' | 'projectName'>> & {
    milestones?: Milestone[];
  },
): Promise<ProjectData> {
  const { project } = await request<{ project: ProjectData }>(
    `/projects/${encodeURIComponent(slug)}`,
    { method: 'PUT', admin: true, body: JSON.stringify(patch) },
  );
  return project;
}

export async function deleteProject(slug: string): Promise<void> {
  await request(`/projects/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
    admin: true,
  });
}
