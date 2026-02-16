import { AuditAction } from '../enums/audit-action.enum.js';

export interface IAuditLog {
  id: string;
  action: AuditAction;
  userId: string;
  resourceType: string;
  resourceId: string;
  details: string;
  createdAt: Date;
}
