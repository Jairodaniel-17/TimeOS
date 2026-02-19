import { NextResponse } from 'next/server';
import { 
  getTaskTimeEntries, 
  createTaskTimeEntry, 
  updateTaskTimeEntry, 
  deleteTaskTimeEntry 
} from '@/lib/luma-docs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');
    const weekNumber = searchParams.get('weekNumber');
    const year = searchParams.get('year');
    
    const filter: { taskId?: string; userId?: string; projectId?: string; weekNumber?: number; year?: number } = {};
    
    if (taskId) filter.taskId = taskId;
    if (userId) filter.userId = userId;
    if (projectId) filter.projectId = projectId;
    if (weekNumber) filter.weekNumber = parseInt(weekNumber);
    if (year) filter.year = parseInt(year);
    
    const entries = await getTaskTimeEntries(Object.keys(filter).length > 0 ? filter : undefined);
    
    return NextResponse.json({ data: entries, success: true });
  } catch (error) {
    console.error('Error fetching task time entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entries', success: false },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taskId, userId, projectId, hours, date, description, billable = true } = body;
    
    // Calculate week number and year from date
    const entryDate = new Date(date);
    const start = new Date(entryDate.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((entryDate.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
    const year = entryDate.getFullYear();
    
    const id = `tte_${Date.now()}`;
    
    const entry = await createTaskTimeEntry({
      id,
      taskId,
      userId,
      projectId,
      hours,
      date,
      description,
      billable,
      weekNumber,
      year,
    });
    
    return NextResponse.json({ data: entry, success: true });
  } catch (error) {
    console.error('Error creating task time entry:', error);
    return NextResponse.json(
      { error: 'Failed to create entry', success: false },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, hours, description, billable } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required', success: false },
        { status: 400 }
      );
    }
    
    const updates: { hours?: number; description?: string; billable?: boolean } = {};
    if (hours !== undefined) updates.hours = hours;
    if (description !== undefined) updates.description = description;
    if (billable !== undefined) updates.billable = billable;
    
    const entry = await updateTaskTimeEntry(id, updates);
    
    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found', success: false },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ data: entry, success: true });
  } catch (error) {
    console.error('Error updating task time entry:', error);
    return NextResponse.json(
      { error: 'Failed to update entry', success: false },
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
    
    await deleteTaskTimeEntry(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task time entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete entry', success: false },
      { status: 500 }
    );
  }
}