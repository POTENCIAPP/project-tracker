/**
 * ClientView.tsx
 * Vista de solo lectura para el cliente: encabezado + línea de tiempo.
 */

import type { Milestone, ProgressSummary, ProjectData } from '../types';
import { ProjectHeader } from './ProjectHeader';
import { MilestoneTimeline } from './MilestoneTimeline';

export interface ClientViewProps {
  data: ProjectData;
  milestones: Milestone[];
  progress: ProgressSummary;
}

export function ClientView({ data, milestones, progress }: ClientViewProps) {
  return (
    <div className="space-y-6">
      <ProjectHeader data={data} role="client" progress={progress} />
      <MilestoneTimeline milestones={milestones} role="client" />
    </div>
  );
}
