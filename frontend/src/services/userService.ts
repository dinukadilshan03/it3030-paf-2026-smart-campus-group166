import type { CreateUserRequest, RoleType, UpdateUserRequest, User, UserStatus } from '../types/auth';
import { apiFetch } from './api';

function buildQuery(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value && value.trim()) {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

export function getUsers(filters: { role?: string; status?: string; search?: string }) {
  return apiFetch<User[]>(`/api/users${buildQuery(filters)}`);
}

export function createUser(payload: CreateUserRequest) {
  return apiFetch<User>('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateUser(userId: number, payload: UpdateUserRequest) {
  return apiFetch<User>(`/api/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function updateUserRole(userId: number, role: RoleType) {
  return apiFetch<User>(`/api/users/${userId}/role?role=${role}`, {
    method: 'PATCH',
  });
}

export function updateUserStatus(userId: number, status: UserStatus) {
  return apiFetch<User>(`/api/users/${userId}/status?status=${status}`, {
    method: 'PATCH',
  });
}
