import { NextRequest, NextResponse } from 'next/server';
import { getApprovals, createApproval, updateApproval, getUsers, getTimeEntries, updateTimeEntry } from '@/lib/luma-docs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100');

    const filter: { status?: string; userId?: string } = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const [approvals, users] = await Promise.all([
      getApprovals(Object.keys(filter).length > 0 ? filter : undefined),
      getUsers(),
    ]);

    const limitedApprovals = approvals.slice(0, limit);

    const userMap = new Map(users.map(u => [u.id, u]));

    return NextResponse.json({
      data: limitedApprovals.map(a => ({
        id: a.id,
        userId: a.userId,
        approverId: a.approverId,
        weekNumber: a.weekNumber,
        year: a.year,
        totalHours: a.totalHours,
        status: a.status,
        comments: a.comments,
        submittedAt: a.submittedAt,
        reviewedAt: a.reviewedAt,
        user: userMap.get(a.userId) || null,
      })),
      success: true,
    });
  } catch (error) {
    console.error('Error fetching approvals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approvals', success: false },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, weekNumber, year, totalHours } = body;

    const id = `apr_${Date.now()}`;
    const now = Date.now();

    const approval = await createApproval({
      id,
      userId,
      weekNumber,
      year,
      totalHours,
      status: 'pending',
      submittedAt: now,
    });

    // Update related time entries to 'pending' status
    const entries = await getTimeEntries({ userId, weekNumber, year });
    for (const entry of entries) {
      await updateTimeEntry(entry.id, { status: 'pending' });
    }

    return NextResponse.json({
      data: approval,
      success: true,
    });
  } catch (error) {
    console.error('Error creating approval:', error);
    return NextResponse.json(
      { error: 'Failed to create approval', success: false },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, approverId, comments } = body;
    const now = Date.now();

    const updates: { status?: 'pending' | 'approved' | 'rejected'; approverId?: string; comments?: string; reviewedAt?: number } = {
      status: status as 'pending' | 'approved' | 'rejected',
      reviewedAt: now,
    };
    if (approverId) updates.approverId = approverId;
    if (comments) updates.comments = comments;

    const approval = await updateApproval(id, updates);

    if (!approval) {
      return NextResponse.json(
        { error: 'Approval not found', success: false },
        { status: 404 }
      );
    }

    // If approved or rejected, update the time entries
    if (status === 'approved' || status === 'rejected') {
      const entries = await getTimeEntries({
        userId: approval.userId,
        weekNumber: approval.weekNumber,
        year: approval.year,
      });
      
      for (const entry of entries) {
        await updateTimeEntry(entry.id, { status });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating approval:', error);
    return NextResponse.json(
      { error: 'Failed to update approval', success: false },
      { status: 500 }
    );
  }
}