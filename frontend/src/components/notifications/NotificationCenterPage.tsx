"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  listNotificationsClient,
  markAllNotificationsReadClient,
  markNotificationReadClient,
} from "@/lib/notifications/client";
import {
  formatNotificationDateTime,
  getNotificationHref,
} from "@/lib/notifications/shared";
import type { NotificationSummary } from "@/lib/notifications/types";

type NotificationCenterPageProps = {
  initialNotifications: NotificationSummary[];
  initialUnreadCount: number;
};

export function NotificationCenterPage({
  initialNotifications,
  initialUnreadCount,
}: NotificationCenterPageProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function syncNotifications() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextNotifications = await listNotificationsClient({
          unreadOnly: showUnreadOnly,
        });
        if (!cancelled) {
          setNotifications(nextNotifications);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "Could not load notifications.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void syncNotifications();

    return () => {
      cancelled = true;
    };
  }, [showUnreadOnly]);

  async function handleMarkRead(id: number) {
    const target = notifications.find((notification) => notification.id === id);
    if (!target || target.isRead) {
      return;
    }

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification,
      ),
    );
    setUnreadCount((current) => Math.max(0, current - 1));

    try {
      await markNotificationReadClient(id);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not update notifications.",
      );
      const nextNotifications = await listNotificationsClient({ unreadOnly: showUnreadOnly });
      setNotifications(nextNotifications);
    }
  }

  async function handleOpenNotification(notification: NotificationSummary) {
    if (!notification.isRead) {
      await handleMarkRead(notification.id);
    }

    router.push(getNotificationHref(notification));
  }

  async function handleMarkAllAsRead() {
    if (unreadCount === 0) {
      return;
    }

    setIsMutating(true);
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsReadClient();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not update notifications.",
      );
      const nextNotifications = await listNotificationsClient({ unreadOnly: showUnreadOnly });
      setNotifications(nextNotifications);
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <section className="space-y-6">
      <section className="rounded-[1.75rem] border border-white/70 bg-white/85 p-8 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Notifications
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              Activity updates
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              Track booking decisions, ticket status changes, and new ticket comments
              from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowUnreadOnly((current) => !current)}
              className={`rounded-full border px-5 py-3 text-sm font-semibold transition ${
                showUnreadOnly
                  ? "border-teal-300 bg-teal-50 text-teal-800"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {showUnreadOnly ? "Showing unread only" : "Show unread only"}
            </button>
            <button
              type="button"
              disabled={isMutating || unreadCount === 0}
              onClick={() => void handleMarkAllAsRead()}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Mark all read
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.35rem] border border-white/70 bg-white/85 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-sm font-medium text-slate-600">Unread</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {unreadCount}
          </p>
        </div>
        <div className="rounded-[1.35rem] border border-white/70 bg-white/85 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-sm font-medium text-slate-600">Visible</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {notifications.length}
          </p>
        </div>
        <div className="rounded-[1.35rem] border border-white/70 bg-white/85 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-sm font-medium text-slate-600">Filter</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {showUnreadOnly ? "Unread" : "All"}
          </p>
        </div>
      </section>

      {errorMessage ? (
        <p className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      <section className="rounded-[1.75rem] border border-white/70 bg-white/85 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
        {isLoading ? (
          <p className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
            Loading notifications...
          </p>
        ) : notifications.length === 0 ? (
          <p className="rounded-[1.2rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
            {showUnreadOnly
              ? "No unread notifications right now."
              : "No notifications have been generated yet."}
          </p>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`rounded-[1.35rem] border p-5 transition ${
                  notification.isRead
                    ? "border-slate-200 bg-slate-50/70"
                    : "border-teal-200 bg-teal-50/70"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold text-slate-950">
                          {notification.title}
                        </h2>
                        <p className="mt-2 text-sm leading-7 text-slate-600">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.isRead ? (
                        <span className="mt-2 h-3 w-3 rounded-full bg-teal-600" />
                      ) : null}
                    </div>

                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {formatNotificationDateTime(notification.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {!notification.isRead ? (
                      <button
                        type="button"
                        onClick={() => void handleMarkRead(notification.id)}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        Mark read
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void handleOpenNotification(notification)}
                      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Open
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
