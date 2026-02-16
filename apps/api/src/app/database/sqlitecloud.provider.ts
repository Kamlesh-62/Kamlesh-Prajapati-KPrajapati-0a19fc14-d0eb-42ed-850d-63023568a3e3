import { Provider } from '@nestjs/common';
import { Database } from '@sqlitecloud/drivers';

export const SQLITE_CLOUD = 'SQLITE_CLOUD';

export const sqliteCloudProvider: Provider = {
  provide: SQLITE_CLOUD,
  useFactory: () => {
    const connectionString = process.env.SQLITECLOUD_URL;
    if (!connectionString) {
      throw new Error('SQLITECLOUD_URL is not set');
    }
    return new Database(connectionString);
  },
};
