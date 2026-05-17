'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, X, Clock, AlertTriangle, CheckCircle, Info, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui';
import type { Notification } from '@/types';

interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.data.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-read', notificationId }),
      });
      fetchNotifications();
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
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'phase_approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'phase_rejected':
        return <X className="h-4 w-4 text-red-500" />;
      case 'hours_reminder':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'deadline_warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'project_assigned':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-redwood-muted" />;
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days}d`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-full hover:bg-redwood-hover-bg transition-colors"
      >
        <Bell className="h-5 w-5 text-redwood-muted" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 bg-redwood-danger text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 z-50">
          <Card padding="none" className="shadow-lg">
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="font-semibold text-sm">Notificaciones</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-redwood-primary hover:text-redwood-primary-hover"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-redwood-muted text-sm">
                  No hay notificaciones
                </div>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-redwood-border hover:bg-redwood-hover-bg cursor-pointer ${
                      !notification.read ? 'bg-redwood-selected-bg' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-redwood-text truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-redwood-muted line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-redwood-muted mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-redwood-primary rounded-full mt-2" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 5 && (
              <div className="p-2 border-t text-center">
                <a
                  href="/notifications"
                  className="text-xs text-redwood-primary hover:text-redwood-primary-hover"
                >
                  Ver todas las notificaciones
                </a>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}