import { NextResponse } from 'next/server';
import {
  getProjectById,
  updateProject,
  deleteProject,
  getProjectPhases,
  createProjectPhases,
  getClients,
  getTaskTimeEntries
} from '@/lib/luma-docs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const project = await getProjectById(projectId);
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found', success: false }, { status: 404 });
    }
    
    let phases = await getProjectPhases(projectId);
    if (phases.length === 0) {
      phases = await createProjectPhases(projectId);
    }

    const [timeEntries, clients] = await Promise.all([
      getTaskTimeEntries({ projectId }),
      project.client ? getClients() : Promise.resolve([]),
    ]);
    const actualHours = timeEntries.reduce((sum, e) => sum + e.hours, 0);
    const clientData = project.client ? (clients.find(c => c.name === project.client) || null) : null;
    
    const revenue = project.billable ? actualHours * (project.hourlyRate || 100) : 0;
    const actualCost = project.actualCost || 0;
    const profit = revenue - actualCost;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
    
    return NextResponse.json({
      data: {
        ...project,
        actualHours,
        profit,
        profitMargin,
        phases,
        clientData,
      },
      success: true,
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Failed to fetch project', success: false }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { ...updates } = body;
    
    const project = await updateProject(projectId, updates);
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found', success: false }, { status: 404 });
    }
    
    return NextResponse.json({ data: project, success: true });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project', success: false }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const project = await getProjectById(projectId);
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found', success: false }, { status: 404 });
    }
    
    await deleteProject(projectId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project', success: false }, { status: 500 });
  }
}
