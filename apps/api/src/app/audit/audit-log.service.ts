import { Injectable } from '@nestjs/common';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { randomUUID } from 'crypto';

@Injectable()
export class AuditLogService {
  constructor(
    private readonly auditLogs: AuditLogRepository
  ) {}

  async logAction(params: {
    action: string;
    userId: string;
    resourceType: string;
    resourceId: string;
    details?: string;
  }) {
    return this.auditLogs.create({
      id: randomUUID(),
      action: params.action,
      user_id: params.userId,
      resource_type: params.resourceType,
      resource_id: params.resourceId,
      details: params.details ?? '',
    });
  }

  async listAll() {
    const rows = await this.auditLogs.listAll();
    return rows.map((row) => ({
      id: row.id,
      action: row.action,
      userId: row.user_id,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      details: row.details,
      createdAt: row.created_at,
      user: row.user_name
        ? { id: row.user_id, name: row.user_name, email: row.user_email }
        : undefined,
    }));
  }
}
