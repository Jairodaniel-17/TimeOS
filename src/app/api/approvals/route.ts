import { NextRequest, NextResponse } from 'next/server';
import { luma } from '@/lib/luma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let sql = `
      SELECT 
        ar.id, ar.user_id, ar.approver_id, ar.week_number, ar.year, 
        ar.total_hours, ar.status, ar.comments, ar.submitted_at, ar.reviewed_at,
        u.name as user_name, u.email as user_email
      FROM approval_requests ar
      LEFT JOIN users u ON ar.user_id = u.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (status) {
      sql += ' AND ar.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY ar.created_at DESC';

    const approvals = await luma.query<{
      id: string;
      user_id: string;
      approver_id: string | null;
      week_number: number;
      year: number;
      total_hours: number;
      status: string;
      comments: string | null;
      submitted_at: number | null;
      reviewed_at: number | null;
      user_name: string;
      user_email: string;
    }>(sql, params);

    return NextResponse.json({
      data: approvals.map(a => ({
        id: a.id,
        userId: a.user_id,
        approverId: a.approver_id,
        weekNumber: a.week_number,
        year: a.year,
        totalHours: a.total_hours,
        status: a.status,
        comments: a.comments,
        submittedAt: a.submitted_at,
        reviewedAt: a.reviewed_at,
        user: {
          id: a.user_id,
          name: a.user_name,
          email: a.user_email,
        },
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

    await luma.exec(
      `INSERT INTO approval_requests 
        (id, user_id, week_number, year, total_hours, status, submitted_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      [id, userId, weekNumber, year, totalHours, now]
    );

    // Update related time entries to 'pending' status
    await luma.exec(
      `UPDATE time_entries 
       SET status = 'pending', updated_at = strftime('%s', 'now') * 1000
       WHERE user_id = ? AND week_number = ? AND year = ?`,
      [userId, weekNumber, year]
    );

    return NextResponse.json({
      data: { id, userId, weekNumber, year, totalHours, status: 'pending', submittedAt: now },
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

    await luma.exec(
      `UPDATE approval_requests 
       SET status = ?, approver_id = ?, comments = ?, reviewed_at = ?
       WHERE id = ?`,
      [status, approverId, comments || null, now, id]
    );

    // If approved or rejected, update the time entries
    if (status === 'approved' || status === 'rejected') {
      const approval = await luma.query<{ user_id: string; week_number: number; year: number }>(
        'SELECT user_id, week_number, year FROM approval_requests WHERE id = ?',
        [id]
      );
      
      if (approval.length > 0) {
        const a = approval[0];
        await luma.exec(
          `UPDATE time_entries 
           SET status = ?, updated_at = strftime('%s', 'now') * 1000
           WHERE user_id = ? AND week_number = ? AND year = ?`,
          [status, a.user_id, a.week_number, a.year]
        );
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
