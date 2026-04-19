"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CalendarRange, MessageSquareText, Ticket, type LucideIcon } from "lucide-react";

import {
  listNotificationsClient,
  markAllNotificationsReadClient,
  markNotificationReadClient,
} from "@/lib/notifications/client";
import {
  formatNotificationDateTime,
  getNotificationHref,
} from "@/lib/notifications/shared";
import {
  getNotificationDestinationLabel,
  getNotificationTypePresentation,
} from "@/lib/notifications/presentation";
import type { NotificationSummary } from "@/lib/notifications/types";

type NotificationBellProps = {
  initialUnreadCount: number;
};

function NotificationTypeIcon({
  notification,
}: {
  notification: NotificationSummary;
}) {
  const iconByType: Record<NotificationSummary["type"], LucideIcon> = {
    BOOKING: CalendarRange,
    TICKET: Ticket,
    COMMENT: MessageSquareText,
    SYSTEM: Bell,
  };
  const Icon = iconByType[notification.type];

  return <Icon className="h-4 w-4" aria-hidden="true" />;
}

export function NotificationBell({ initialUnreadCount }: NotificationBellProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [notifications, setNotifications] = useState<NotificationSummary[]>([]);

  async function loadRecentNotifications() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const recentNotifications = await listNotificationsClient({ limit: 6 });
      setNotifications(recentNotifications);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not load notifications.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void loadRecentNotifications();
  }, [isOpen]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (!isOpen) {
      return;
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  async function handleNotificationClick(notification: NotificationSummary) {
    const href = getNotificationHref(notification);

    if (!notification.isRead) {
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item,
        ),
      );
      setUnreadCount((current) => Math.max(0, current - 1));

      try {
        await markNotificationReadClient(notification.id);
      } catch {
        await loadRecentNotifications();
      }
    }

    setIsOpen(false);
    router.push(href);
  }

  async function handleMarkAllAsRead() {
    if (unreadCount === 0) {
      return;
    }

    setIsMutating(true);
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsReadClient();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not update notifications.",
      );
      await loadRecentNotifications();
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-50"
      >
        <span className="sr-only">Open notifications</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h11Z" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[color:#8f4b31] px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-30 mt-3 w-[22rem] rounded-[1.4rem] border border-stone-200 bg-[#fffdfa] p-4 shadow-[0_22px_56px_rgba(38,33,28,0.14)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                Notifications
              </p>
              <p className="mt-2 text-sm text-stone-600">
                {unreadCount === 0
                  ? "All caught up."
                  : `${unreadCount} unread notification(s).`}
              </p>
            </div>
            <button
              type="button"
              disabled={isMutating || unreadCount === 0}
              onClick={() => void handleMarkAllAsRead()}
              className="text-sm font-semibold text-stone-900 transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mark all read
            </button>
          </div>

          {errorMessage ? (
            <p className="mt-4 rounded-2xl border border-[color:rgba(168,95,58,0.2)] bg-[rgba(168,95,58,0.08)] px-3 py-2 text-sm text-[color:#8f4b31]">
              {errorMessage}
            </p>
          ) : null}

          <div className="mt-4 space-y-3">
            {isLoading ? (
              <p className="rounded-[1rem] border border-stone-200 bg-stone-50 px-4 py-5 text-sm text-stone-600">
                Loading recent notifications...
              </p>
            ) : notifications.length === 0 ? (
              <p className="rounded-[1rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm text-stone-600">
                No notifications yet.
              </p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void handleNotificationClick(notification)}
                  className={`w-full rounded-[1.1rem] border px-4 py-3 text-left transition ${
                    notification.isRead
                      ? "border-stone-200 bg-stone-50 hover:bg-stone-100"
                      : "border-lime-300 bg-lime-50 hover:bg-lime-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${getNotificationTypePresentation(notification.type).badgeClassName}`}
                      >
                        <NotificationTypeIcon notification={notification} />
                        {getNotificationTypePresentation(notification.type).label}
                      </span>
                    </div>
                    {!notification.isRead ? (
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[color:var(--accent)]" />
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-stone-900">
                    {notification.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                    Opens {getNotificationDestinationLabel(notification)}
                  </p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                    {formatNotificationDateTime(notification.createdAt)}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="mt-4 border-t border-stone-200 pt-4">
            <Link
              href="/notifications"
              className="text-sm font-semibold text-stone-900 transition hover:opacity-80"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
