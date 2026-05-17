# Project Tracker — Demo

Proyecto Vite + React + TypeScript con el módulo `<ProjectTracker />` y una
capa de acceso: login para el equipo admin y links públicos para los clientes.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abrí la URL que muestra Vite (normalmente `http://localhost:5173`).

## Modelo de acceso

Dos espacios separados:

- **Admin** (`/login` → `/admin`): el equipo de la agencia se autentica.
  Credencial demo: `admin@potenciapp.com` / `demo1234`.
- **Cliente** (`/p/:token`): acceso por link, sin cuenta. Quien tiene el link
  ve el proyecto en modo lectura (patrón *capability URL*).

### Flujo para probarlo

1. Entrá a `http://localhost:5173` → te redirige a `/login`.
2. Ingresá con la credencial demo. Caés en `/admin`.
3. Desde `/admin` armás lo que verá el cliente:
   - **Editar** (lápiz en la cabecera): nombre del proyecto y del cliente.
   - **Agregar hito**: creás título, descripción, estado y entregables.
   - **Editar / Eliminar** por hito, y cambio de estado.
   - **Arrastrar** (handle de agarre ⠿ junto al número) para reordenar hitos.
4. En el panel "Link para el cliente", copiá el link.
5. Abrí ese link en otra pestaña (o ventana incógnito): ves la vista del
   cliente, de solo lectura, sin login, con lo que armaste.
6. Volvé a `/admin` y probá "Regenerar link" — el anterior deja de funcionar.

Todo lo que el admin crea se persiste en `localStorage` (clave
`project-tracker:project`), así sobrevive recargas y el link del cliente lo
refleja. Es por navegador: un cliente en otro dispositivo necesita el backend
real (Supabase). Para volver al demo original, borrá esa clave de localStorage.

## Arquitectura

```
src/
├── App.tsx                   tabla de rutas
├── main.tsx                  providers (Router, Auth)
├── lib/
│   ├── branding.ts           nombre de la agencia (editable)
│   ├── shareLink.ts          generación de tokens + armado de URLs
│   └── mockProjectStore.ts   BACKEND SIMULADO (único punto de datos)
├── pages/
│   ├── AdminProjectPage.tsx  panel admin + link del cliente
│   ├── SharedProjectPage.tsx vista pública del cliente
│   └── NotFoundPage.tsx
└── features/
    ├── auth/                 AuthProvider, useAuth, ProtectedRoute, LoginPage
    └── project-tracker/      el módulo (sin cambios estructurales)
```

`ProjectTracker` sigue siendo agnóstico de auth: auth, routing y datos viven
en capas por encima del feature.

## Conectar Supabase (cuando lo necesites)

La migración toca solo dos archivos; el resto de la app no cambia:

1. src/features/auth/AuthProvider.tsx — reemplazá el bloque MOCK AUTH:
   - signIn  -> supabase.auth.signInWithPassword(...)
   - signOut -> supabase.auth.signOut()
   - estado inicial -> supabase.auth.getSession() + onAuthStateChange(...)
2. src/lib/mockProjectStore.ts — reemplazá el cuerpo de las funciones
   (hoy operan sobre localStorage; la firma async ya tiene forma de backend):
   - getAdminProject       -> query con RLS (admin autenticado)
   - resolveProjectByToken -> RPC get_project_by_token(token) con
     SECURITY DEFINER, invocable por el rol anon
   - regenerateShareToken  -> UPDATE del token (solo admin)
   - updateProject         -> UPDATE de projects (solo admin)
   - createMilestone / upsertMilestone -> INSERT / UPSERT en milestones
   - deleteMilestone       -> DELETE en milestones
   - reorderMilestones     -> UPDATE batch del campo `order`

Importante: los chequeos de rol del frontend son UX, no seguridad.
La autorización real va en las policies de RLS / el backend.

## Integrarlo en tu proyecto de la agencia

Copiá src/features/project-tracker/ (y opcionalmente src/features/auth/).
Requiere lucide-react, react-router-dom y Tailwind CSS.
