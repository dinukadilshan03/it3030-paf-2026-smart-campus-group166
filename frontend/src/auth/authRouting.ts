import type { User } from '../types/auth';

export function getDefaultRouteForUser(user: Pick<User, 'role'> | null) {
  if (!user) {
    return '/login';
  }

  return user.role === 'ADMIN' ? '/admin/users' : '/app';
}
