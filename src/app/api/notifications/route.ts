import { NextResponse } from 'next/server';
import { 
  getNotifications, 
  getUnreadNotificationCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  createNotification,
  getTaskTimeEntries
} from '@/lib/luma-docs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required', success: false }, { status: 400 });
    }
    
    if (action === 'unread-count') {
      const count = await getUnreadNotificationCount(userId);
      return NextResponse.json({ data: { count }, success: true });
    }
    
    const notifications = await getNotifications(userId);
    
    return NextResponse.json({ data: notifications, success: true });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications', success: false }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { action, userId, notificationId } = body;
    
    if (action === 'mark-all-read' && userId) {
      await markAllNotificationsAsRead(userId);
      return NextResponse.json({ success: true });
    }
    
    if (action === 'mark-read' && notificationId) {
      await markNotificationAsRead(notificationId);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Invalid action', success: false }, { status: 400 });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Failed to update notification', success: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, userIds, projectId, phaseId, title, message } = body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'userIds array is required', success: false }, { status: 400 });
    }
    
    const notifications = await Promise.all(
      userIds.map((userId: string) =>
        createNotification({
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          type: type || 'project_assigned',
          title,
          message,
          projectId,
          phaseId,
          read: false,
        })
      )
    );
    
    return NextResponse.json({ data: notifications, success: true });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Failed to create notification', success: false }, { status: 500 });
  }
}
