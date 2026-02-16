import { Module } from '@nestjs/common';
import { sqliteCloudProvider, SQLITE_CLOUD } from './sqlitecloud.provider';
import { DatabaseService } from './database.service';

@Module({
  providers: [sqliteCloudProvider, DatabaseService],
  exports: [DatabaseService, SQLITE_CLOUD],
})
export class DatabaseModule {}
