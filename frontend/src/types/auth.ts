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

export type DashboardCard = {
  title: string;
  href: string;
  description: string;
  roles: RoleCode[];
};

export type DashboardDefinition = {
  badge: string;
  heading: string;
  description: string;
  cards: DashboardCard[];
};
