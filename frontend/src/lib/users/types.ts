import type { RoleCode, UserStatus } from "@/types/auth";

export type UserLoginMethod = "GOOGLE" | "LOCAL";

export type AdminUserSummary = {
  id: number;
  email: string;
  displayName: string;
  role: RoleCode | null;
  status: UserStatus;
  lastLoginAt: string | null;
  hasLocalCredentials: boolean;
  mustChangePassword: boolean;
  loginMethod: UserLoginMethod;
};

export type AdminUserDetail = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  phone: string | null;
  profileImageUrl: string | null;
  role: RoleCode;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  hasLocalCredentials: boolean;
  mustChangePassword: boolean;
  loginMethod: UserLoginMethod;
};

export type UserFilters = {
  role?: RoleCode | "";
  status?: UserStatus | "";
  search?: string;
};

export type CreateUserRequest = {
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  profileImageUrl?: string;
  role: Extract<RoleCode, "STAFF" | "ADMIN">;
  status?: UserStatus;
};

export type UpdateUserRequest = {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  profileImageUrl?: string;
};

export type UpdateUserRoleRequest = {
  role: Extract<RoleCode, "STAFF" | "ADMIN">;
};

export type UpdateUserStatusRequest = {
  status: UserStatus;
};

export type CreateLocalCredentialsRequest = {
  temporaryPassword: string;
};

export type ResetLocalPasswordRequest = {
  temporaryPassword: string;
};

export type ApiErrorResponse = {
  message?: string;
  code?: string;
  validationErrors?: Record<string, string>;
};
