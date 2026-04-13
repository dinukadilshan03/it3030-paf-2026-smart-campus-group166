export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type RoleType = 'ADMIN' | 'USER' | 'TECHNICIAN';
export type OAuthProvider = 'LOCAL' | 'GOOGLE' | null;

export interface User {
  userId: number;
  name: string;
  email: string;
  role: RoleType;
  department: string | null;
  phone: string | null;
  status: UserStatus;
  oauthProvider: OAuthProvider;
  localAccount: boolean;
}

export interface CurrentUserResponse {
  authenticated: boolean;
  user: User | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: RoleType;
  department: string;
  phone: string;
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  department: string;
  phone: string;
}
