import type { Role } from './types';

export function hasRole(roles: Role[] | undefined | null, role: Role) {
  return !!roles?.includes(role);
}

export function isPhotographerOnly(roles: Role[] | undefined | null) {
  return hasRole(roles, 'photographer_videographer') && !hasRole(roles, 'dj_producer');
}
