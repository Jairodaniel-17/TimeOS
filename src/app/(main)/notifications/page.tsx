'use client';

import { useState, useEffect } from 'react';
import { Header, PageLayout, PageContent } from '@/components/layout';
import { Card, Button, Badge } from '@/components/ui';
import { Bell, Check, X, Clock, AlertTriangle, CheckCircle, Info, TrendingUp, CheckCheck } from 'lucide-react';
import type { Notification } from '@/types';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserId(user.id);
      fetchNotifications(user.id);
    }
  }, []);

  const fetchNotifications = async (uid: string) => {
    try {
      const res = await fetch(`/api/notifications?userId=${uid}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-read', notificationId }),
      });
      fetchNotifications(userId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-all-read', userId }),
      });
      fetchNotifications(userId);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'phase_approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'phase_rejected':
        return <X className="h-5 w-5 text-red-500" />;
      case 'hours_reminder':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'deadline_warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'project_assigned':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-redwood-muted" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'phase_approved':
        return <Badge severity="success">Fase Aprobada</Badge>;
      case 'phase_rejected':
        return <Badge severity="error">Fase Rechazada</Badge>;
      case 'hours_reminder':
        return <Badge severity="warning">Recordatorio</Badge>;
      case 'deadline_warning':
        return <Badge severity="warning">Alerta</Badge>;
      case 'project_assigned':
        return <Badge severity="info">Asignación</Badge>;
      default:
        return <Badge severity="info">Notificación</Badge>;
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <PageLayout>
        <Header title="Notificaciones" breadcrumbs={[{ label: 'TimeOS' }, { label: 'Notificaciones' }]} />
        <PageContent className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header
        title="Notificaciones"
        breadcrumbs={[{ label: 'TimeOS' }, { label: 'Notificaciones' }]}
        actions={
          unreadCount > 0 && (
            <Button variant="subtle" icon={<CheckCheck className="h-4 w-4" />} onClick={markAllAsRead}>
              Marcar todas como leídas
            </Button>
          )
        }
      />
      <PageContent>
        {notifications.length === 0 ? (
          <Card className="text-center py-12">
            <Bell className="h-12 w-12 text-redwood-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-redwood-text mb-2">No hay notificaciones</h3>
            <p className="text-redwood-muted">Cuando tengas notificaciones, aparecerán aquí.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {unreadCount > 0 && (
              <div className="bg-redwood-selected-bg border border-redwood-selected-border rounded-lg p-4">
                <p className="text-sm text-redwood-primary">
                  Tienes <strong>{unreadCount}</strong> {unreadCount === 1 ? 'notificación sin leer' : 'notificaciones sin leer'}
                </p>
              </div>
            )}

            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-all cursor-pointer ${
                  !notification.read ? 'border-l-4 border-l-redwood-primary bg-redwood-selected-bg' : ''
                }`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-redwood-text">{notification.title}</h3>
                      <div className="flex items-center gap-2">
                        {getNotificationBadge(notification.type)}
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            title="Marcar como leída"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-redwood-muted mb-2">{notification.message}</p>
                    <p className="text-xs text-redwood-muted">{formatDate(notification.createdAt)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}