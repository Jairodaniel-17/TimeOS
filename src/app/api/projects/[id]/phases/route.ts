import { NextResponse } from 'next/server';
import { 
  getProjectPhases, 
  createProjectPhases, 
  getPhaseApproval,
  getApprovalFiles,
  getAllTasksFlat,
  getTaskTimeEntries,
  getResources
} from '@/lib/luma-docs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    
    let phases = await getProjectPhases(projectId);
    if (phases.length === 0) {
      phases = await createProjectPhases(projectId);
    }
    
    const [tasks, timeEntries, resources] = await Promise.all([
      getAllTasksFlat(),
      getTaskTimeEntries({ projectId }),
      getResources(),
    ]);
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const resourceByUserId = new Map(resources.map(r => [r.userId, r]));

    const phasesWithDetails = await Promise.all(
      phases.map(async (phase) => {
        const phaseTasks = projectTasks.filter(t => t.phaseId === phase.phaseId);
        const approval = await getPhaseApproval(phase.id);
        const approvalFiles = approval ? await getApprovalFiles(approval.id) : [];

        let totalHours = 0;
        let totalCost = 0;

        for (const task of phaseTasks) {
          for (const entry of timeEntries.filter(e => e.taskId === task.id)) {
            totalHours += entry.hours;
            const resource = resourceByUserId.get(entry.userId);
            if (resource) totalCost += entry.hours * resource.hourlyRate;
          }
        }

        return {
          ...phase,
          actualHours: totalHours,
          actualCost: totalCost,
          taskCount: phaseTasks.length,
          approval,
          approvalFiles,
          tasks: phaseTasks,
        };
      })
    );
    
    return NextResponse.json({ data: phasesWithDetails, success: true });
  } catch (error) {
    console.error('Error fetching project phases:', error);
    return NextResponse.json({ error: 'Failed to fetch project phases', success: false }, { status: 500 });
  }
}