import { NextRequest, NextResponse } from 'next/server';
import { luma } from '@/lib/luma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const weekNumber = searchParams.get('weekNumber');
    const year = searchParams.get('year');

    let sql = `
      SELECT 
        te.id, te.user_id, te.project_id, te.activity, te.notes, te.billable,
        te.week_number, te.year, te.mon, te.tue, te.wed, te.thu, te.fri, te.sat, te.sun,
        te.total, te.status,
        p.name as project_name, p.code as project_code, p.client as project_client
      FROM time_entries te
      LEFT JOIN projects p ON te.project_id = p.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (userId) {
      sql += ' AND te.user_id = ?';
      params.push(userId);
    }
    if (weekNumber) {
      sql += ' AND te.week_number = ?';
      params.push(parseInt(weekNumber));
    }
    if (year) {
      sql += ' AND te.year = ?';
      params.push(parseInt(year));
    }

    sql += ' ORDER BY te.created_at DESC';

    const entries = await luma.query<{
      id: string;
      user_id: string;
      project_id: string;
      activity: string;
      notes: string | null;
      billable: number;
      week_number: number;
      year: number;
      mon: number;
      tue: number;
      wed: number;
      thu: number;
      fri: number;
      sat: number;
      sun: number;
      total: number;
      status: string;
      project_name: string;
      project_code: string;
      project_client: string | null;
    }>(sql, params);

    return NextResponse.json({
      data: entries.map(e => ({
        id: e.id,
        userId: e.user_id,
        projectId: e.project_id,
        activity: e.activity,
        notes: e.notes,
        billable: e.billable === 1,
        weekNumber: e.week_number,
        year: e.year,
        hours: {
          mon: e.mon,
          tue: e.tue,
          wed: e.wed,
          thu: e.thu,
          fri: e.fri,
          sat: e.sat,
          sun: e.sun,
        },
        total: e.total,
        status: e.status,
        project: {
          id: e.project_id,
          name: e.project_name,
          code: e.project_code,
          client: e.project_client,
        },
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
    const total = Object.values(hours).reduce((a: number, b) => a + (b as number), 0);

    await luma.exec(
      `INSERT INTO time_entries 
        (id, user_id, project_id, activity, notes, billable, week_number, year, mon, tue, wed, thu, fri, sat, sun, total, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [
        id, userId, projectId, activity, notes || null, billable ? 1 : 0,
        weekNumber, year,
        hours.mon, hours.tue, hours.wed, hours.thu, hours.fri, hours.sat, hours.sun,
        total
      ]
    );

    return NextResponse.json({
      data: { id, userId, projectId, activity, notes, billable, weekNumber, year, hours, total, status: 'draft' },
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
    
    const total = hours ? Object.values(hours).reduce((a: number, b) => a + (b as number), 0) : 0;

    if (hours) {
      await luma.exec(
        `UPDATE time_entries 
         SET activity = ?, notes = ?, mon = ?, tue = ?, wed = ?, thu = ?, fri = ?, sat = ?, sun = ?, total = ?, status = ?, updated_at = strftime('%s', 'now') * 1000
         WHERE id = ?`,
        [activity, notes || null, hours.mon, hours.tue, hours.wed, hours.thu, hours.fri, hours.sat, hours.sun, total, status, id]
      );
    } else {
      await luma.exec(
        `UPDATE time_entries 
         SET activity = ?, notes = ?, status = ?, updated_at = strftime('%s', 'now') * 1000
         WHERE id = ?`,
        [activity, notes || null, status, id]
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

    await luma.exec('DELETE FROM time_entries WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting time entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete time entry', success: false },
      { status: 500 }
    );
  }
}
