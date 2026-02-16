import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from '../repositories/users.repository';
import { OrganizationsRepository } from '../repositories/organizations.repository';
import { SQLITE_CLOUD } from '../database/sqlitecloud.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [
    UsersService,
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
})
export class UsersModule {}
