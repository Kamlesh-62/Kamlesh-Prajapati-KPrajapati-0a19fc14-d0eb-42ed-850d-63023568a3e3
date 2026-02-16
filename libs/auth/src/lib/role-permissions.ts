import { Role } from '@kprajapati/data';
import { Permission } from './permissions.js';

/**
 * Maps each role to its directly assigned permissions.
 * Role inheritance is handled via role hierarchy — a higher role
 * automatically has all permissions of lower roles.
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.Viewer]: [
    Permission.ReadTask,
  ],
  [Role.Admin]: [
    Permission.ReadTask,
    Permission.CreateTask,
    Permission.UpdateTask,
    Permission.DeleteTask,
    Permission.ViewAuditLog,
  ],
  [Role.Owner]: [
    Permission.ReadTask,
    Permission.CreateTask,
    Permission.UpdateTask,
    Permission.DeleteTask,
    Permission.ViewAuditLog,
    Permission.ManageUsers,
  ],
};

export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return getPermissionsForRole(role).includes(permission);
}
