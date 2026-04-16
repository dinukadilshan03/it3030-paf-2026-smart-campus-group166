import type { RoleCode, UserStatus } from "@/types/auth";

export type UserLoginMethod = "GOOGLE" | "LOCAL";

export type Profile = {
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

export type UpdateProfileRequest = {
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  phone?: string | null;
  profileImageUrl?: string | null;
};

export type ApiErrorResponse = {
  message?: string;
  code?: string;
  validationErrors?: Record<string, string>;
};
