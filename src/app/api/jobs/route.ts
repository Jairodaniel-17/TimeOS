import { NextResponse } from 'next/server';
import { luma } from '@/lib/luma';

interface JobDoc {
  id: string;
  type: 'export' | 'sync' | 'report' | 'close' | 'import';
  status: 'running' | 'completed' | 'failed' | 'scheduled' | 'cancelled';
  initiatedBy: string;
  progress: number;
  startedAt: number;
  completedAt?: number;
  durationMs?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');

    const docs = await luma.findDocs<JobDoc>('jobs', undefined, 500);
    let jobs = docs.map(d => d.doc).sort((a, b) => b.startedAt - a.startedAt);

    if (status) jobs = jobs.filter(j => j.status === status);
    jobs = jobs.slice(0, limit);

    return NextResponse.json({
      data: jobs.map(j => ({
        ...j,
        duration: j.durationMs ? formatDuration(j.durationMs) : undefined,
      })),
      success: true,
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs', success: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, initiatedBy, metadata } = body;

    const job: JobDoc = {
      id: `job_${Date.now()}`,
      type: type || 'export',
      status: 'running',
      initiatedBy: initiatedBy || 'System',
      progress: 0,
      startedAt: Date.now(),
      metadata,
    };

    await luma.putDoc('jobs', job.id, job);
    return NextResponse.json({ data: job, success: true });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: 'Failed to create job', success: false }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, progress } = body;

    if (!id) return NextResponse.json({ error: 'id is required', success: false }, { status: 400 });

    const result = await luma.getDoc<JobDoc>('jobs', id);
    if (!result) return NextResponse.json({ error: 'Job not found', success: false }, { status: 404 });

    const updates: Partial<JobDoc> = {};
    if (status) updates.status = status;
    if (progress !== undefined) updates.progress = progress;

    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      updates.completedAt = Date.now();
      updates.durationMs = Date.now() - result.doc.startedAt;
    }

    const updated = { ...result.doc, ...updates };
    await luma.putDoc('jobs', id, updated);

    return NextResponse.json({
      data: { ...updated, duration: updated.durationMs ? formatDuration(updated.durationMs) : undefined },
      success: true,
    });
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json({ error: 'Failed to update job', success: false }, { status: 500 });
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(0)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}
