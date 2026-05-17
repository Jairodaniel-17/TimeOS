import { NextResponse } from 'next/server';
import { getProjects, getProjectById, createProject, updateProject, getTaskTimeEntries } from '@/lib/luma-docs';
import { projectSchema } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const withCosts = searchParams.get('withCosts') === 'true';
    const page = parseInt(searchParams.get('page') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '0');

    const projects = await getProjects();

    let result = projects;

    if (withCosts) {
      const timeEntries = await getTaskTimeEntries();
      result = projects.map((project) => {
        const projectEntries = timeEntries.filter(e => e.projectId === project.id);
        const actualHours = projectEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
        let actualCost = 0;
        for (const entry of projectEntries) {
          actualCost += (entry.hours || 0) * 50;
        }
        const revenue = project.billable ? actualHours * (project.hourlyRate || 100) : 0;
        const profit = revenue - actualCost;
        const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
        return { ...project, actualHours, actualCost, profit, profitMargin };
      });
    }

    const total = result.length;
    const paginated = page > 0 && pageSize > 0
      ? result.slice((page - 1) * pageSize, page * pageSize)
      : result;

    return NextResponse.json({
      data: paginated,
      ...(page > 0 && pageSize > 0 ? { pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } } : {}),
      success: true,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects', success: false },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = projectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e: { message: string }) => e.message).join(', '), success: false },
        { status: 400 }
      );
    }

    const id = `proj_${Date.now()}`;
    const project = await createProject({ id, ...parsed.data });

    return NextResponse.json({ data: project, success: true });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project', success: false },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    const project = await updateProject(id, updates);
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found', success: false }, { status: 404 });
    }
    
    return NextResponse.json({ data: project, success: true });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project', success: false },
      { status: 500 }
    );
  }
}