export type NotificationType = "BOOKING" | "TICKET" | "COMMENT" | "SYSTEM";

export type NotificationReferenceType = "BOOKING" | "TICKET" | "COMMENT";

export type NotificationSummary = {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  referenceType: NotificationReferenceType | null;
  referenceId: number | null;
  isRead: boolean;
  createdAt: string;
};

export type UnreadNotificationCountResponse = {
  unreadCount: number;
};
