import { NextRequest, NextResponse } from 'next/server';
import { getApprovals, createApproval, updateApproval, getUsers, getTimeEntries, updateTimeEntry, createNotification } from '@/lib/luma-docs';

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

    const [entries, managers] = await Promise.all([
      getTimeEntries({ userId, weekNumber, year }),
      getUsers(),
    ]);
    const managerIds = managers.filter(u => u.role === 'admin' || u.role === 'manager').map(u => u.id);

    await Promise.all([
      ...entries.map(e => updateTimeEntry(e.id, { status: 'pending' })),
      ...managerIds.map(mid => createNotification({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: mid,
        type: 'approval_pending',
        title: 'Timesheet pendiente de aprobación',
        message: `Un timesheet de la semana ${weekNumber}/${year} ha sido enviado para revisión.`,
        read: false,
      })),
    ]);

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

    if (status === 'approved' || status === 'rejected' || status === 'changes_requested') {
      const entries = await getTimeEntries({
        userId: approval.userId,
        weekNumber: approval.weekNumber,
        year: approval.year,
      });

      const notifTitle = status === 'approved'
        ? 'Timesheet aprobado'
        : status === 'rejected'
        ? 'Timesheet rechazado'
        : 'Se solicitaron cambios en tu timesheet';

      const notifMessage = status === 'approved'
        ? `Tu timesheet de la semana ${approval.weekNumber}/${approval.year} ha sido aprobado.`
        : status === 'rejected'
        ? `Tu timesheet de la semana ${approval.weekNumber}/${approval.year} fue rechazado. ${comments || ''}`
        : `Se solicitaron cambios en tu timesheet de la semana ${approval.weekNumber}/${approval.year}. ${comments || ''}`;

      await Promise.all([
        ...(status !== 'changes_requested' ? entries.map(e => updateTimeEntry(e.id, { status: status === 'approved' ? 'approved' : 'rejected' })) : []),
        createNotification({
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: approval.userId,
          type: status === 'approved' ? 'approval_approved' : status === 'rejected' ? 'approval_rejected' : 'approval_changes',
          title: notifTitle,
          message: notifMessage,
          read: false,
        }),
      ]);
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