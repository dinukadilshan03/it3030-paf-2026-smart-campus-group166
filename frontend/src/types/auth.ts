export type RoleCode = "STUDENT" | "STAFF" | "ADMIN";

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type AuthErrorCode =
  | "oauth_failed"
  | "account_blocked"
  | "invalid_profile"
  | "provisioning_failed"
  | "oauth_not_allowed"
  | "local_login_not_allowed"
  | "invalid_credentials"
  | "password_change_required";

export type AuthApiError = {
  code: AuthErrorCode;
  message: string;
};

export type CurrentUser = {
  authenticated: boolean;
  id: number | null;
  email: string | null;
  displayName: string | null;
  role: RoleCode | null;
  status: UserStatus | null;
  passwordChangeRequired: boolean;
};

export type NavItem = {
  title: string;
  href: string;
  roles: RoleCode[];
  description?: string;
};

export type DashboardAction = {
  title: string;
  href: string;
  description: string;
  eyebrow?: string;
  meta?: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
  href?: string;
};

export type DashboardListItem = {
  title: string;
  description: string;
  href: string;
  eyebrow?: string;
  meta?: string;
  tone?: "default" | "muted" | "accent" | "warning";
};

export type DashboardPanel = {
  title: string;
  description?: string;
  items: DashboardListItem[];
};

type DashboardSectionPlacement = "main" | "rail";

export type DashboardHeroSection = {
  type: "hero";
  eyebrow: string;
  title: string;
  description: string;
  cta?: {
    label: string;
    href: string;
  };
  secondaryCta?: {
    label: string;
    href: string;
  };
};

export type DashboardMetricsSection = {
  type: "metrics";
  items: DashboardMetric[];
};

export type DashboardPrimaryActionsSection = {
  type: "primaryActions";
  title: string;
  description?: string;
  placement?: DashboardSectionPlacement;
  items: DashboardAction[];
};

export type DashboardActivitySection = {
  type: "activity";
  title: string;
  description?: string;
  placement?: DashboardSectionPlacement;
  items: DashboardListItem[];
};

export type DashboardAlertsSection = {
  type: "alerts";
  title: string;
  description?: string;
  placement?: DashboardSectionPlacement;
  items: DashboardListItem[];
};

export type DashboardListsSection = {
  type: "lists";
  title: string;
  description?: string;
  placement?: DashboardSectionPlacement;
  columns?: 1 | 2;
  items: DashboardListItem[];
};

export type DashboardSecondaryPanelsSection = {
  type: "secondaryPanels";
  title?: string;
  placement?: DashboardSectionPlacement;
  panels: DashboardPanel[];
};

export type DashboardDefinition = {
  sections: Array<
    | DashboardHeroSection
    | DashboardMetricsSection
    | DashboardPrimaryActionsSection
    | DashboardActivitySection
    | DashboardAlertsSection
    | DashboardListsSection
    | DashboardSecondaryPanelsSection
  >;
};
