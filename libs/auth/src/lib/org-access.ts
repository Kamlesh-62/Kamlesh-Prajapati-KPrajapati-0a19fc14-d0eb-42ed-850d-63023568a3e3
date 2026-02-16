import { Role } from '@kprajapati/data';
import { isRoleAtLeast } from './role-hierarchy.js';

/**
 * Determines if a user can access resources in a given organization.
 *
 * - Viewers can only access their own organization.
 * - Admins can access their own organization.
 * - Owners can access their own organization and any child organizations.
 */
export function canAccessOrganization(
  userRole: Role,
  userOrgId: string,
  targetOrgId: string,
  parentOrgId: string | null,
): boolean {
  // Same org — always allowed
  if (userOrgId === targetOrgId) {
    return true;
  }

  // Owner can access child organizations (parent of the target is the user's org)
  if (isRoleAtLeast(userRole, Role.Owner) && parentOrgId === userOrgId) {
    return true;
  }

  return false;
}
