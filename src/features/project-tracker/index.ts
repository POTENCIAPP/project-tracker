/**
 * index.ts
 * API publica del modulo Project Tracker. Importa siempre desde aqui:
 *   import { ProjectTracker } from '@/features/project-tracker';
 */

export { ProjectTracker, default } from './ProjectTracker';

export type {
  Milestone,
  MilestoneDraft,
  MilestoneStatus,
  ProjectData,
  ProjectTrackerProps,
  UserRole,
} from './types';
