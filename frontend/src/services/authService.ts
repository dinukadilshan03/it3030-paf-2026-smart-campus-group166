import type { CurrentUserResponse, LoginRequest } from '../types/auth';
import { apiFetch, apiRequest } from './api';

export function getCurrentUser() {
  return apiFetch<CurrentUserResponse>('/api/auth/me');
}

export function login(request: LoginRequest) {
  return apiFetch<CurrentUserResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function logout() {
  return apiRequest('/api/auth/logout', {
    method: 'POST',
  });
}
