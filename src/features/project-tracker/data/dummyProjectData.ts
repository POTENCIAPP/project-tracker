/**
 * dummyProjectData.ts
 * Datos de ejemplo. Cubren los 4 estados posibles para probar la UI al instante.
 */

import type { ProjectData } from '../types';

export const dummyProjectData: ProjectData = {
  projectId: 'PRJ-2026-0142',
  clientName: 'María Fernández',
  projectName: 'Plataforma de E-commerce B2B',
  // Token inicial del link del cliente (en producción lo genera el backend).
  publicToken: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
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
};
