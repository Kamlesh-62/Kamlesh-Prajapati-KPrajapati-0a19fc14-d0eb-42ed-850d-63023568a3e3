import { Injectable } from '@nestjs/common';
import { Database } from '@sqlitecloud/drivers';

export interface AuditLogRow {
  id: string;
  action: string;
  user_id: string;
  resource_type: string;
  resource_id: string;
  details: string;
  created_at: string;
}

export interface AuditLogWithUserRow extends AuditLogRow {
  user_name?: string;
  user_email?: string;
}

@Injectable()
export class AuditLogRepository {
  constructor(private readonly db: Database) {}

  async create(entry: Omit<AuditLogRow, 'created_at'>) {
    const now = new Date().toISOString();
    await this.db.sql(
      'INSERT INTO audit_logs (id, action, user_id, resource_type, resource_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      entry.id,
      entry.action,
      entry.user_id,
      entry.resource_type,
      entry.resource_id,
      entry.details,
      now
    );
    return { ...entry, created_at: now };
  }

  async listAll(): Promise<AuditLogWithUserRow[]> {
    return (await this.db.sql(
      `SELECT a.*, u.name as user_name, u.email as user_email
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC`
    )) as AuditLogWithUserRow[];
  }
}
