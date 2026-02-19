import { NextRequest, NextResponse } from 'next/server';
import { getTimeEntries, createTimeEntry, updateTimeEntry, deleteTimeEntry, getProjects, type TimeEntryDoc } from '@/lib/luma-docs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const weekNumber = searchParams.get('weekNumber');
    const year = searchParams.get('year');
    const limit = parseInt(searchParams.get('limit') || '100');

    const filter: { userId?: string; weekNumber?: number; year?: number } = {};
    if (userId) filter.userId = userId;
    if (weekNumber) filter.weekNumber = parseInt(weekNumber);
    if (year) filter.year = parseInt(year);

    const [entries, projects] = await Promise.all([
      getTimeEntries(Object.keys(filter).length > 0 ? filter : undefined),
      getProjects(),
    ]);

    const projectMap = new Map(projects.map(p => [p.id, p]));
    const limitedEntries = entries.slice(0, limit);

    return NextResponse.json({
      data: limitedEntries.map(e => ({
        id: e.id,
        userId: e.userId,
        projectId: e.projectId,
        activity: e.activity,
        notes: e.notes,
        billable: e.billable,
        weekNumber: e.weekNumber,
        year: e.year,
        hours: e.hours,
        total: e.total,
        status: e.status,
        project: projectMap.get(e.projectId) || null,
      })),
      success: true,
    });
  } catch (error) {
    console.error('Error fetching time entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time entries', success: false },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      projectId,
      activity,
      notes,
      billable = true,
      weekNumber,
      year,
      hours = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
    } = body;

    const id = `te_${Date.now()}`;
    const total = Object.values(hours as Record<string, number>).reduce((a, b) => a + b, 0);

    const entry = await createTimeEntry({
      id,
      userId,
      projectId,
      activity,
      notes,
      billable,
      weekNumber,
      year,
      hours,
      total,
      status: 'draft',
    });

    return NextResponse.json({
      data: entry,
      success: true,
    });
  } catch (error) {
    console.error('Error creating time entry:', error);
    return NextResponse.json(
      { error: 'Failed to create time entry', success: false },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, activity, notes, hours, status } = body;
    
    const updates: Partial<TimeEntryDoc> = {};
    if (activity !== undefined) updates.activity = activity;
    if (notes !== undefined) updates.notes = notes;
    if (status !== undefined) updates.status = status;
    if (hours) {
      updates.hours = hours;
      updates.total = Object.values(hours as Record<string, number>).reduce((a, b) => a + b, 0);
    }

    const entry = await updateTimeEntry(id, updates);

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found', success: false },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating time entry:', error);
    return NextResponse.json(
      { error: 'Failed to update time entry', success: false },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required', success: false },
        { status: 400 }
      );
    }

    await deleteTimeEntry(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting time entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete time entry', success: false },
      { status: 500 }
    );
  }
}