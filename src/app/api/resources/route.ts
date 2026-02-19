import { NextResponse } from 'next/server';
import { getResources, getUsers, createResource, getTaskTimeEntries, getProjects, type ResourceDoc } from '@/lib/luma-docs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const withCosts = searchParams.get('withCosts') === 'true';
    
    const [resources, users, timeEntries, projects] = await Promise.all([
      getResources(),
      getUsers(),
      getTaskTimeEntries(),
      getProjects(),
    ]);
    
    const userMap = new Map(users.map(u => [u.id, u]));
    const projectMap = new Map(projects.map(p => [p.id, p.name]));
    
    if (withCosts) {
      // Calculate costs per resource
      const resourcesWithCosts = resources.map(r => {
        const user = userMap.get(r.userId);
        const resourceEntries = timeEntries.filter(e => e.userId === r.userId);
        const totalHours = resourceEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
        const totalCost = totalHours * (r.hourlyRate || 0);
        const projectIds = [...new Set(resourceEntries.map(e => e.projectId))];
        const projectNames = projectIds.map(pid => projectMap.get(pid)).filter(Boolean) as string[];
        
        return {
          id: r.id,
          userId: r.userId,
          userName: user?.name || 'Unknown',
          hourlyRate: r.hourlyRate || 0,
          monthlySalary: r.monthlySalary,
          currency: r.currency,
          totalHours,
          totalCost,
          projects: projectNames,
        };
      });
      
      return NextResponse.json({ data: resourcesWithCosts, success: true });
    }
    
    const formattedResources = resources.map(r => ({
      id: r.id,
      userId: r.userId,
      capacity: r.capacity,
      skills: r.skills || [],
      user: userMap.get(r.userId) || null,
    }));
    
    return NextResponse.json({ data: formattedResources, success: true });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources', success: false },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, capacity = 40, skills = [], hourlyRate = 0, monthlySalary, currency = 'USD' } = body;
    
    const id = `resource_${Date.now()}`;
    const resource = await createResource({ id, userId, capacity, skills, hourlyRate, monthlySalary, currency });
    
    return NextResponse.json({ data: resource, success: true });
  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { error: 'Failed to create resource', success: false },
      { status: 500 }
    );
  }
}