/**
 * lib/store.ts
 * ----------------------------------------------------------------------------
 * Capa de persistencia del backend serverless (carpeta /api).
 *
 * Vive FUERA de /api a propósito: así Vercel no la expone como endpoint, solo
 * la bundlea cuando una función la importa.
 *
 * Dos modos, decididos en runtime:
 *   - KV   : si existen KV_REST_API_URL + KV_REST_API_TOKEN (Vercel KV / Upstash).
 *            Persistencia real, compartida entre dispositivos. <- modo producción.
 *   - MEM  : si NO hay credenciales de KV. Mapa en memoria del proceso.
 *            La app funciona igual, pero los datos se reinician en cada cold
 *            start. Sirve para ver el deploy antes de provisionar el storage.
 *
 * Todo el dataset se guarda como UN documento JSON bajo la clave `pt:db`.
 * Es chico (un puñado de proyectos) y simplifica el modelo enormemente.
 * ----------------------------------------------------------------------------
 */

export type MilestoneStatus = 'pending' | 'in_progress' | 'client_review' | 'completed';

export interface Milestone {
  id: string;
  order: number;
  title: string;
  description: string;
  status: MilestoneStatus;
  deliverables: string[];
  lastUpdated: string;
}

export interface ProjectData {
  /** Slug estable: es lo que va en el link del cliente (/c/<slug> o <slug>.dominio). */
  slug: string;
  projectId: string;
  clientName: string;
  projectName: string;
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}

interface Db {
  projects: Record<string, ProjectData>;
}

// La integración de Vercel/Upstash inyecta uno u otro juego de nombres según
// si es "Vercel KV" clásico o "Upstash for Redis" del Marketplace nuevo.
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const DB_KEY = 'pt:db';

export function storageMode(): 'kv' | 'memory' {
  return KV_URL && KV_TOKEN ? 'kv' : 'memory';
}

/** ¿Las escrituras de admin están protegidas por token de servidor? */
export function adminToken(): string | null {
  return process.env.ADMIN_TOKEN?.trim() || null;
}

/* ===== Cliente Redis REST (Upstash / Vercel KV) =========================== */

async function redis<T = unknown>(command: unknown[]): Promise<T | null> {
  const res = await fetch(KV_URL as string, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) {
    throw new Error(`KV ${command[0]} falló: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { result: T | null };
  return json.result ?? null;
}

/* ===== Fallback en memoria (efímero) ====================================== */

// eslint-disable-next-line no-var
declare global {
  // Reusa el mismo objeto entre invocaciones calientes del mismo proceso.
  var __PT_MEM_DB__: Db | undefined;
}
function memDb(): Db {
  if (!globalThis.__PT_MEM_DB__) globalThis.__PT_MEM_DB__ = seedDb();
  return globalThis.__PT_MEM_DB__;
}

/* ===== Acceso al documento completo ======================================= */

async function readDb(): Promise<Db> {
  if (storageMode() === 'memory') return memDb();
  const raw = await redis<string>(['GET', DB_KEY]);
  if (!raw) {
    const seeded = seedDb();
    await writeDb(seeded);
    return seeded;
  }
  try {
    const parsed = JSON.parse(raw) as Db;
    if (!parsed || typeof parsed.projects !== 'object') return seedDb();
    return parsed;
  } catch {
    return seedDb();
  }
}

async function writeDb(db: Db): Promise<void> {
  if (storageMode() === 'memory') {
    globalThis.__PT_MEM_DB__ = db;
    return;
  }
  await redis(['SET', DB_KEY, JSON.stringify(db)]);
}

/* ===== Operaciones de dominio ============================================= */

export async function listProjects(): Promise<ProjectData[]> {
  const db = await readDb();
  return Object.values(db.projects).sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );
}

export async function getProject(slug: string): Promise<ProjectData | null> {
  const db = await readDb();
  return db.projects[slug] ?? null;
}

export async function createProject(input: {
  clientName: string;
  projectName: string;
}): Promise<ProjectData> {
  const db = await readDb();
  const slug = uniqueSlug(slugify(input.clientName || input.projectName || 'cliente'), db);
  const now = new Date().toISOString();
  const project: ProjectData = {
    slug,
    projectId: `PRJ-${new Date().getFullYear()}-${String(
      Object.keys(db.projects).length + 1,
    ).padStart(4, '0')}`,
    clientName: input.clientName.trim() || 'Cliente',
    projectName: input.projectName.trim() || 'Proyecto',
    milestones: [],
    createdAt: now,
    updatedAt: now,
  };
  db.projects[slug] = project;
  await writeDb(db);
  return project;
}

export async function updateProject(
  slug: string,
  patch: Partial<Pick<ProjectData, 'clientName' | 'projectName' | 'milestones'>>,
): Promise<ProjectData | null> {
  const db = await readDb();
  const current = db.projects[slug];
  if (!current) return null;
  const next: ProjectData = {
    ...current,
    ...(patch.clientName !== undefined ? { clientName: patch.clientName } : {}),
    ...(patch.projectName !== undefined ? { projectName: patch.projectName } : {}),
    ...(patch.milestones !== undefined
      ? { milestones: renumber(patch.milestones) }
      : {}),
    updatedAt: new Date().toISOString(),
  };
  db.projects[slug] = next;
  await writeDb(db);
  return next;
}

export async function deleteProject(slug: string): Promise<boolean> {
  const db = await readDb();
  if (!db.projects[slug]) return false;
  delete db.projects[slug];
  await writeDb(db);
  return true;
}

/* ===== Utilidades ========================================================= */

function renumber(milestones: Milestone[]): Milestone[] {
  return [...milestones]
    .sort((a, b) => a.order - b.order)
    .map((m, i) => ({ ...m, order: i + 1 }));
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // saca acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'cliente';
}

function uniqueSlug(base: string, db: Db): string {
  if (!db.projects[base]) return base;
  let n = 2;
  while (db.projects[`${base}-${n}`]) n += 1;
  return `${base}-${n}`;
}

/** Dataset inicial: un proyecto demo para poder ver el deploy de una. */
function seedDb(): Db {
  const now = new Date().toISOString();
  return {
    projects: {
      demo: {
        slug: 'demo',
        projectId: 'PRJ-2026-0142',
        clientName: 'María Fernández',
        projectName: 'Plataforma de E-commerce B2B',
        createdAt: now,
        updatedAt: now,
        milestones: [
          {
            id: 'ms-01',
            order: 1,
            title: 'Discovery del Negocio',
            description:
              'Relevamiento de objetivos, análisis de la competencia y definición del alcance funcional del proyecto.',
            status: 'completed',
            deliverables: [
              'Documento de requerimientos',
              'Mapa de stakeholders',
              'Definición de alcance (SOW)',
            ],
            lastUpdated: '2026-04-08T14:00:00.000Z',
          },
          {
            id: 'ms-02',
            order: 2,
            title: 'Diseño UI/UX',
            description:
              'Arquitectura de información, wireframes y diseño visual de alta fidelidad de las pantallas clave.',
            status: 'client_review',
            deliverables: [
              'Wireframes de los flujos principales',
              'Sistema de diseño (UI Kit)',
              'Prototipo navegable en Figma',
            ],
            lastUpdated: '2026-05-06T14:00:00.000Z',
          },
          {
            id: 'ms-03',
            order: 3,
            title: 'Desarrollo Core',
            description:
              'Implementación del frontend, integración con la API y desarrollo de las funcionalidades centrales.',
            status: 'in_progress',
            deliverables: [
              'Maquetado responsive',
              'Integración de autenticación',
              'Módulo de pagos',
              'Panel de administración',
            ],
            lastUpdated: '2026-05-14T14:00:00.000Z',
          },
          {
            id: 'ms-04',
            order: 4,
            title: 'Demo y Ajustes Finales',
            description:
              'Pruebas de calidad, corrección de los últimos detalles y puesta en producción del proyecto.',
            status: 'pending',
            deliverables: [
              'Testing QA integral',
              'Optimización de performance',
              'Deploy a producción',
              'Capacitación al cliente',
            ],
            lastUpdated: '2026-04-30T14:00:00.000Z',
          },
        ],
      },
    },
  };
}
