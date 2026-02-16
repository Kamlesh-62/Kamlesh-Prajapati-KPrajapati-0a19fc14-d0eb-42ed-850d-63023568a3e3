import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { AuditLogModule } from '../audit/audit-log.module';
import { DatabaseModule } from '../database/database.module';
import { SQLITE_CLOUD } from '../database/sqlitecloud.provider';
import { TasksRepository } from '../repositories/tasks.repository';
import { UsersRepository } from '../repositories/users.repository';
import { OrganizationsRepository } from '../repositories/organizations.repository';

@Module({
  imports: [DatabaseModule, AuditLogModule],
  providers: [
    TasksService,
    {
      provide: TasksRepository,
      useFactory: (db) => new TasksRepository(db),
      inject: [SQLITE_CLOUD],
    },
    {
      provide: UsersRepository,
      useFactory: (db) => new UsersRepository(db),
      inject: [SQLITE_CLOUD],
    },
    {
      provide: OrganizationsRepository,
      useFactory: (db) => new OrganizationsRepository(db),
      inject: [SQLITE_CLOUD],
    },
  ],
  controllers: [TasksController],
})
export class TasksModule {}
