import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsRepository } from '../repositories/organizations.repository';
import { SQLITE_CLOUD } from '../database/sqlitecloud.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [OrganizationsController],
  providers: [
    {
      provide: OrganizationsRepository,
      useFactory: (db) => new OrganizationsRepository(db),
      inject: [SQLITE_CLOUD],
    },
  ],
})
export class OrganizationsModule {}
