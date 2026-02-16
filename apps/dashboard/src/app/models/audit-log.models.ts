export interface AuditLogEntry {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}
