"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { Notification } from "@/types/api";
import { Button } from "@/components/ui/button";

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const loadNotifications = async () => {
    try {
      const data = await api.listNotifications();
      setNotifications(data);
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAllAsRead = async () => {
    await api.markAllNotificationsRead();
    await loadNotifications();
  };

  return (
    <div className="relative">
      <button
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-white text-muted shadow-sm transition hover:text-ink"
        aria-label="Notifications"
        onClick={() => setIsOpen((value) => !value)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent-500 px-1 text-xs font-bold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-md border border-border bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Notifications</h2>
            <Button className="h-8 px-2" variant="ghost" onClick={markAllAsRead} aria-label="Mark all as read">
              <CheckCheck className="h-4 w-4" />
            </Button>
          </div>
          <div className="max-h-96 overflow-auto scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted">No notifications</div>
            ) : (
              notifications.slice(0, 8).map((notification) => (
                <button
                  key={notification.id}
                  className="block w-full border-b border-border px-4 py-3 text-left transition hover:bg-background"
                  onClick={async () => {
                    if (!notification.isRead) {
                      await api.markNotificationRead(notification.id);
                      await loadNotifications();
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">{notification.title}</p>
                    {!notification.isRead ? <span className="mt-1 h-2 w-2 rounded-full bg-brand-500" /> : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{notification.message}</p>
                  <p className="mt-2 text-xs text-muted">{formatDateTime(notification.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
