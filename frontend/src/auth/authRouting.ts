import type { User } from '../types/auth';

export function getDefaultRouteForUser(user: Pick<User, 'role'> | null) {
  if (!user) {
    return '/login';
  }

  if (user.role === 'ADMIN') {
    return '/app';
  }

  if (user.role === 'USER' || user.role === 'TECHNICIAN') {
    return '/student/dashboard';
  }

  return '/app';
}
