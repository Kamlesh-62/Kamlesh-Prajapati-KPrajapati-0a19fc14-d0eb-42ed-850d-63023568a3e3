import { Role } from '@kprajapati/data';

/**
 * Role hierarchy: Owner > Admin > Viewer
 * A higher-ranked role inherits all permissions of lower-ranked roles.
 */
const ROLE_RANK: Record<Role, number> = {
  [Role.Owner]: 3,
  [Role.Admin]: 2,
  [Role.Viewer]: 1,
};

export function getRoleRank(role: Role): number {
  return ROLE_RANK[role] ?? 0;
}

export function isRoleAtLeast(userRole: Role, requiredRole: Role): boolean {
  return getRoleRank(userRole) >= getRoleRank(requiredRole);
}
