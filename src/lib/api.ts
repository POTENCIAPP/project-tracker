/**
 * api.ts
 * ----------------------------------------------------------------------------
 * Cliente del backend serverless (/api).
 *
 *  - Admin (panel Potenciapp): autentica con token en header `x-pt-admin`
 *    (se guarda en localStorage vía AdminTokenField).
 *  - Cliente (portal): inicia sesión con usuario/contraseña; el backend
 *    devuelve un token de sesión firmado que se manda en `Authorization`.
 * ----------------------------------------------------------------------------
 */

import type { Milestone, ProjectData } from '@/features/project-tracker';

export interface ProgressSummary {
  total: number;
  completed: number;
  inProgress: number;
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

export interface ClientUser {
  username: string;
  slug: string;
  projectName: string;
  createdAt: string;
}

/* ===== Tokens ============================================================= */

const ADMIN_TOKEN_KEY = 'pt_admin_token';
const CLIENT_TOKEN_KEY = 'pt_client_session';

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

export function getClientToken(): string {
  try {
    return localStorage.getItem(CLIENT_TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
}

function setClientToken(token: string): void {
  try {
    localStorage.setItem(CLIENT_TOKEN_KEY, token);
  } catch {
    /* noop */
  }
}

export function clientLogout(): void {
  try {
    localStorage.removeItem(CLIENT_TOKEN_KEY);
  } catch {
    /* noop */
  }
}

/** Lee (sin verificar firma) el payload del token de sesión del cliente. */
export function getClientSession(): { u: string; s: string; exp: number } | null {
  const t = getClientToken();
  if (!t) return null;
  try {
    const json = atob(t.split('.')[0].replace(/-/g, '+').replace(/_/g, '/'));
    const s = JSON.parse(json);
    if (!s?.s || typeof s.exp !== 'number' || s.exp < Date.now()) return null;
    return s;
  } catch {
    return null;
  }
}

/* ===== Request =========================================================== */

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
export { ApiError };

async function request<T>(
  path: string,
  init: RequestInit & { admin?: boolean; clientAuth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  if (init.admin) {
    const token = getAdminToken();
    if (token) headers.set('x-pt-admin', token);
  }
  if (init.clientAuth) {
    const token = getClientToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`/api${path}`, { ...init, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(res.status, data?.error || `Error ${res.status}`);
  }
  return data as T;
}

/* ===== Salud / Admin proyectos =========================================== */

export function getHealth(): Promise<HealthInfo> {
  return request<HealthInfo>('/health');
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const { projects } = await request<{ projects: ProjectSummary[] }>('/projects', {
    admin: true,
  });
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

/** Carga un proyecto como ADMIN (token x-pt-admin). */
export async function adminGetProject(slug: string): Promise<ProjectData | null> {
  try {
    const { project } = await request<{ project: ProjectData }>(
      `/projects/${encodeURIComponent(slug)}`,
      { admin: true },
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

/* ===== Auth cliente ====================================================== */

export async function clientLogin(
  username: string,
  password: string,
): Promise<{ slug: string; projectName: string }> {
  const data = await request<{ token: string; slug: string; projectName: string }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ username, password }) },
  );
  setClientToken(data.token);
  return { slug: data.slug, projectName: data.projectName };
}

/** Carga el proyecto del cliente autenticado. 401 si no hay sesión válida. */
export async function getClientProject(slug: string): Promise<ProjectData> {
  const { project } = await request<{ project: ProjectData }>(
    `/projects/${encodeURIComponent(slug)}`,
    { clientAuth: true },
  );
  return project;
}

/* ===== Admin usuarios ==================================================== */

export async function listUsers(): Promise<ClientUser[]> {
  const { users } = await request<{ users: ClientUser[] }>('/users', {
    admin: true,
  });
  return users;
}

export async function createUser(input: {
  username: string;
  password: string;
  slug: string;
}): Promise<ClientUser> {
  const { user } = await request<{ user: ClientUser }>('/users', {
    method: 'POST',
    admin: true,
    body: JSON.stringify(input),
  });
  return user;
}

export async function deleteUser(username: string): Promise<void> {
  await request(`/users/${encodeURIComponent(username)}`, {
    method: 'DELETE',
    admin: true,
  });
}
