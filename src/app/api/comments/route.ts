import { NextResponse } from 'next/server';
import {
  getComments,
  createComment,
  deleteComment,
  logActivity,
  getUsers,
} from '@/lib/luma-docs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required', success: false },
        { status: 400 }
      );
    }

    const [comments, users] = await Promise.all([
      getComments({ entityType, entityId }),
      getUsers(),
    ]);
    const userMap = new Map(users.map(u => [u.id, u]));

    const enriched = comments.map(c => ({
      ...c,
      user: { name: userMap.get(c.userId)?.name || '' },
    }));

    return NextResponse.json({ data: enriched, success: true });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments', success: false },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { entityType, entityId, userId, body: commentBody } = body;

    if (!entityType || !entityId || !userId || !commentBody?.trim()) {
      return NextResponse.json(
        { error: 'entityType, entityId, userId and body are required', success: false },
        { status: 400 }
      );
    }

    const id = `cmt_${Date.now()}`;
    const comment = await createComment({
      id,
      entityType,
      entityId,
      userId,
      body: commentBody.trim(),
    });

    await logActivity({ entityType, entityId, userId, action: 'comment' });

    return NextResponse.json({ data: comment, success: true });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment', success: false },
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

    await deleteComment(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment', success: false },
      { status: 500 }
    );
  }
}
