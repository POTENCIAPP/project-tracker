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

/** Dataset inicial: el proyecto real de Gisbert Refrigeraciones. */
function seedDb(): Db {
  const createdAt = '2026-05-06T14:00:00.000Z';
  const lastUpdated = '2026-05-18T12:00:00.000Z';
  return {
    projects: {
      gisbert: {
        slug: 'gisbert',
        projectId: 'PRJ-2026-0001',
        clientName: 'Gisbert Refrigeraciones',
        projectName: 'Nueva Landing + Sistema de Gestión',
        createdAt,
        updatedAt: lastUpdated,
        milestones: [
          {
            id: 'ms-01',
            order: 1,
            title: 'Discovery y alineación',
            description:
              'Cierre del alcance funcional, firma de la propuesta y recolección de inputs visuales y de negocio para arrancar la ejecución.',
            status: 'completed',
            deliverables: [
              'Alcance funcional cerrado (landing + sistema)',
              'Propuesta económica firmada',
              'Definición de stack técnico',
              'Solicitud de inputs visuales al equipo Gisbert',
            ],
            lastUpdated: '2026-05-06T14:00:00.000Z',
          },
          {
            id: 'ms-02',
            order: 2,
            title: 'Rediseño de la Landing',
            description:
              'Renovación visual y de contenido de la landing institucional: nueva identidad, materiales reales del taller y una sección que humaniza a la empresa.',
            status: 'in_progress',
            deliverables: [
              'Rediseño corporativo (paleta, tipografías, layout)',
              'Integración de fotos reales del taller y del equipo',
              'Video institucional generado con IA',
              'Sección "Quiénes están detrás"',
              'Limpieza de secciones obsoletas (capacitaciones)',
            ],
            lastUpdated: '2026-05-18T12:00:00.000Z',
          },
          {
            id: 'ms-03',
            order: 3,
            title: 'Sistema — Productos compuestos y stock',
            description:
              'Modelo de productos con subitems: productos unitarios y productos compuestos con lista de materiales (BOM) que descuentan stock automáticamente.',
            status: 'pending',
            deliverables: [
              'Alta y edición de productos unitarios',
              'Productos compuestos con BOM (lista de materiales)',
              'Descuento automático de stock de materiales al vender un compuesto',
              'Vista de stock unificada',
            ],
            lastUpdated: '2026-05-06T14:00:00.000Z',
          },
          {
            id: 'ms-04',
            order: 4,
            title: 'Sistema — Órdenes de Fabricación digitales',
            description:
              'Reemplazo del flujo manual: cada venta puede generar Órdenes de Fabricación con estados de avance, vinculadas al producto y al cliente.',
            status: 'pending',
            deliverables: [
              'Generación de OF a partir de una venta',
              'Estados de avance (pendiente / en producción / lista)',
              'Vinculación OF ↔ venta ↔ cliente',
              'Listado y filtros de OF',
            ],
            lastUpdated: '2026-05-06T14:00:00.000Z',
          },
          {
            id: 'ms-05',
            order: 5,
            title: 'Sistema — Ventas y Facturación',
            description:
              'Visibilidad y control del ciclo de facturación: una venta puede tener varias facturas, con badges que muestran el avance, y exportación directa al canal de comunicación del cliente.',
            status: 'pending',
            deliverables: [
              'Badge de estado por venta (no facturado / parcial con % / facturado)',
              'Facturación parcial y total',
              'Múltiples facturas asociadas a una misma venta',
              'Exportación de facturas a WhatsApp',
            ],
            lastUpdated: '2026-05-06T14:00:00.000Z',
          },
          {
            id: 'ms-06',
            order: 6,
            title: 'QA, deploy y capacitación',
            description:
              'Pruebas finales del sistema completo, puesta en producción y entrenamiento del equipo Gisbert para que opere la solución de forma autónoma.',
            status: 'pending',
            deliverables: [
              'Testing integral end-to-end',
              'Despliegue a producción',
              'Capacitación al equipo Gisbert',
              'Documento de uso interno',
            ],
            lastUpdated: '2026-05-06T14:00:00.000Z',
          },
        ],
      },
    },
  };
}
