/**
 * App.tsx
 * Tabla de rutas. Define los dos espacios de acceso del producto:
 *   /admin     -> protegido, requiere login (equipo de la agencia)
 *   /p/:token  -> publico, acceso del cliente por link (sin login)
 */

import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage, ProtectedRoute } from '@/features/auth';
import { AdminProjectPage } from '@/pages/AdminProjectPage';
import { SharedProjectPage } from '@/pages/SharedProjectPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Espacio de administracion: protegido por autenticacion */}
      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminProjectPage />} />
      </Route>

      {/* Vista del cliente: publica, se resuelve por token de link */}
      <Route path="/p/:token" element={<SharedProjectPage />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
