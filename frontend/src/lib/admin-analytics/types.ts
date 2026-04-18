export type AnalyticsRange = "7D" | "30D" | "90D";

export type AnalyticsMetricCard = {
  id: string;
  label: string;
  value: string;
  changeLabel: string;
  trend: "up" | "down" | "flat";
  href: string;
};

export type AnalyticsAlert = {
  id: string;
  title: string;
  message: string;
  severity: "high" | "medium" | "low";
  href: string;
  referencedMetricIds: string[];
};

export type AnalyticsQuickLink = {
  id: string;
  label: string;
  href: string;
  description: string;
};

export type AnalyticsNamedValue = {
  id: string;
  label: string;
  value: string;
  href: string;
};

export type AnalyticsSeriesPoint = {
  id: string;
  label: string;
  value: number;
  href: string;
};

export type AnalyticsInsightItem = {
  text: string;
  referencedMetricIds: string[];
};

export type AnalyticsRecentUserActivity = {
  id: number;
  displayName: string;
  email: string;
  role: "STUDENT" | "STAFF" | "ADMIN" | null;
  lastLoginAt: string;
  href: string;
};

export type AdminAnalyticsOverview = {
  range: AnalyticsRange;
  generatedAt: string;
  metrics: AnalyticsMetricCard[];
  alerts: AnalyticsAlert[];
  quickLinks: AnalyticsQuickLink[];
};

export type AdminAnalyticsChartBundle = {
  range: AnalyticsRange;
  generatedAt: string;
  bookingsByDay: AnalyticsSeriesPoint[];
  peakBookingHours: AnalyticsSeriesPoint[];
  topResources: AnalyticsSeriesPoint[];
  topLocations: AnalyticsSeriesPoint[];
  ticketsByDay: AnalyticsSeriesPoint[];
  ticketCategories: AnalyticsSeriesPoint[];
  notificationTypes: AnalyticsSeriesPoint[];
  authEventsByType: AnalyticsSeriesPoint[];
};

export type AdminAnalyticsHealth = {
  range: AnalyticsRange;
  generatedAt: string;
  roleDistribution: AnalyticsNamedValue[];
  statusDistribution: AnalyticsNamedValue[];
  loginMethodDistribution: AnalyticsNamedValue[];
  authHealth: AnalyticsNamedValue[];
  notificationHealth: AnalyticsNamedValue[];
  flags: AnalyticsAlert[];
  recentSignIns: AnalyticsRecentUserActivity[];
};

export type AdminAnalyticsInsightResponse = {
  available: boolean;
  message: string;
  summary: string;
  highlights: AnalyticsInsightItem[];
  anomalies: AnalyticsInsightItem[];
  recommendations: AnalyticsInsightItem[];
  followUpQuestions: string[];
};

export type AdminAnalyticsAskRequest = {
  range: AnalyticsRange;
  question: string;
};

export type AdminAnalyticsAskResponse = {
  available: boolean;
  message: string;
  answer: string;
  confidence: number;
  referencedMetricIds: string[];
  recommendedLinks: AnalyticsQuickLink[];
};
