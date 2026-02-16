import { Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { DatabaseModule } from '../database/database.module';
import { SQLITE_CLOUD } from '../database/sqlitecloud.provider';
import { AuditLogRepository } from '../repositories/audit-log.repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    AuditLogService,
    {
      provide: AuditLogRepository,
      useFactory: (db) => new AuditLogRepository(db),
      inject: [SQLITE_CLOUD],
    },
  ],
  controllers: [AuditLogController],
  exports: [AuditLogService],
})
export class AuditLogModule {}
