/**
 * index.ts
 * API publica del modulo Project Tracker. Importa siempre desde aqui:
 *   import { ProjectTracker, dummyProjectData } from '@/features/project-tracker';
 */

export { ProjectTracker, default } from './ProjectTracker';
export { dummyProjectData } from './data/dummyProjectData';

export type {
  Milestone,
  MilestoneDraft,
  MilestoneStatus,
  ProjectData,
  ProjectTrackerProps,
  UserRole,
} from './types';
