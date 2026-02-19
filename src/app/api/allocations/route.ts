import { NextResponse } from 'next/server';
import { getAllocations, getResources, getUsers, getProjects, createResource, createAllocation, getAllocations as getAllocationsFromDocs } from '@/lib/luma-docs';
import { luma } from '@/lib/luma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');
    const projectId = searchParams.get('projectId');
    const weekNumber = searchParams.get('weekNumber');
    const year = searchParams.get('year');
    
    const filter: { resourceId?: string; projectId?: string; weekNumber?: number; year?: number } = {};
    if (resourceId) filter.resourceId = resourceId;
    if (projectId) filter.projectId = projectId;
    if (weekNumber) filter.weekNumber = parseInt(weekNumber);
    if (year) filter.year = parseInt(year);
    
    const [allocations, resources, users, projects] = await Promise.all([
      getAllocations(Object.keys(filter).length > 0 ? filter : undefined),
      getResources(),
      getUsers(),
      getProjects(),
    ]);
    
    const userMap = new Map(users.map(u => [u.id, u]));
    const projectMap = new Map(projects.map(p => [p.id, p]));
    const resourceMap = new Map(resources.map(r => [r.id, r]));
    
    const formattedAllocations = allocations.map(a => {
      const resource = resourceMap.get(a.resourceId);
      return {
        id: a.id,
        resourceId: a.resourceId,
        projectId: a.projectId,
        weekNumber: a.weekNumber,
        year: a.year,
        allocatedHours: a.allocatedHours,
        resource: resource ? {
          id: resource.id,
          user: userMap.get(resource.userId) || null,
        } : null,
        project: projectMap.get(a.projectId) || null,
      };
    });
    
    return NextResponse.json({ data: formattedAllocations, success: true });
  } catch (error) {
    console.error('Error fetching allocations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch allocations', success: false },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { resourceId, projectId, weekNumber, year, allocatedHours } = body;
    
    const id = `allocation_${Date.now()}`;
    const allocation = await createAllocation({
      id,
      resourceId,
      projectId,
      weekNumber,
      year,
      allocatedHours,
    });
    
    return NextResponse.json({ data: allocation, success: true });
  } catch (error) {
    console.error('Error creating allocation:', error);
    return NextResponse.json(
      { error: 'Failed to create allocation', success: false },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, allocatedHours } = body;
    
    if (allocatedHours === undefined) {
      return NextResponse.json(
        { error: 'allocatedHours is required', success: false },
        { status: 400 }
      );
    }
    
    // Get all allocations and find the one to update
    const allAllocations = await getAllocationsFromDocs();
    const existing = allAllocations.find(a => a.id === id);
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Allocation not found', success: false },
        { status: 404 }
      );
    }
    
    const updated = { ...existing, allocatedHours };
    await luma.putDoc('allocations', id, updated);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating allocation:', error);
    return NextResponse.json(
      { error: 'Failed to update allocation', success: false },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required', success: false },
        { status: 400 }
      );
    }
    
    await luma.deleteDoc('allocations', id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting allocation:', error);
    return NextResponse.json(
      { error: 'Failed to delete allocation', success: false },
      { status: 500 }
    );
  }
}