export type RoleCode = "STUDENT" | "STAFF" | "ADMIN";

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type CurrentUser = {
  authenticated: boolean;
  id: number | null;
  email: string | null;
  displayName: string | null;
  role: RoleCode | null;
  status: UserStatus | null;
};

export type NavItem = {
  title: string;
  href: string;
  roles: RoleCode[];
};
