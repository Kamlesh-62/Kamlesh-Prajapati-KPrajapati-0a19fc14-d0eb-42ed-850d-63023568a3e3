import { Controller, Get, UseGuards } from '@nestjs/common';
import { Permission } from '@kprajapati/auth';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Permissions(Permission.ViewAuditLog)
  list() {
    return this.auditLogService.listAll();
  }
}
