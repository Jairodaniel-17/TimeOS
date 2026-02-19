import { NextResponse } from 'next/server';
import { getProjects, getProjectById, createProject, updateProject, getTaskTimeEntries } from '@/lib/luma-docs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const withCosts = searchParams.get('withCosts') === 'true';
    
    const projects = await getProjects();
    
    if (withCosts) {
      // Fetch time entries to calculate actual costs
      const timeEntries = await getTaskTimeEntries();
      const resourceRates: Record<string, number> = {};
      
      // Calculate costs per project
      const projectsWithCosts = await Promise.all(
        projects.map(async (project) => {
          // Get hours for this project
          const projectEntries = timeEntries.filter(e => e.projectId === project.id);
          const actualHours = projectEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
          
          // Calculate actual cost based on resource hourly rates
          let actualCost = 0;
          for (const entry of projectEntries) {
            const rate = resourceRates[entry.userId] || 50; // Default rate
            actualCost += (entry.hours || 0) * rate;
          }
          
          // Calculate revenue and profit for billable projects
          const revenue = project.billable ? actualHours * (project.hourlyRate || 100) : 0;
          const profit = revenue - actualCost;
          const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
          
          return {
            ...project,
            actualHours,
            actualCost,
            profit,
            profitMargin,
          };
        })
      );
      
      return NextResponse.json({ data: projectsWithCosts, success: true });
    }
    
    return NextResponse.json({ data: projects, success: true });
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
    const { name, code, client, billable = true, status = 'active', startDate, endDate, budget, budgetHours, hourlyRate, currency = 'USD' } = body;
    
    const id = `proj_${Date.now()}`;
    const project = await createProject({ id, name, code, client, billable, status, startDate, endDate, budget, budgetHours, hourlyRate, currency });
    
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