import type { NotificationSummary, NotificationType } from "@/lib/notifications/types";

type NotificationTypePresentation = {
  badgeClassName: string;
  label: string;
};

const NOTIFICATION_TYPE_PRESENTATION: Record<NotificationType, NotificationTypePresentation> = {
  BOOKING: {
    badgeClassName:
      "border-amber-200 bg-amber-50 text-amber-800",
    label: "Booking",
  },
  TICKET: {
    badgeClassName:
      "border-sky-200 bg-sky-50 text-sky-800",
    label: "Ticket",
  },
  COMMENT: {
    badgeClassName:
      "border-teal-200 bg-teal-50 text-teal-800",
    label: "Comment",
  },
  SYSTEM: {
    badgeClassName:
      "border-slate-200 bg-slate-100 text-slate-700",
    label: "System",
  },
};

export function getNotificationTypePresentation(type: NotificationType) {
  return NOTIFICATION_TYPE_PRESENTATION[type];
}

export function getNotificationDestinationLabel(notification: NotificationSummary) {
  if (notification.referenceType === "BOOKING") {
    return "Bookings";
  }

  if (notification.referenceType === "TICKET" || notification.referenceType === "COMMENT") {
    return "Tickets";
  }

  return "Notification center";
}

export function getNotificationOpenLabel(notification: NotificationSummary) {
  if (notification.referenceType === "BOOKING") {
    return "Open booking";
  }

  if (notification.referenceType === "TICKET" || notification.referenceType === "COMMENT") {
    return "Open ticket";
  }

  return "Open";
}
