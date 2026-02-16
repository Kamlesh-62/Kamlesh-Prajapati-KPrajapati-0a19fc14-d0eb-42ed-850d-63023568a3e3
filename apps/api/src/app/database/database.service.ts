import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Database } from '@sqlitecloud/drivers';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import * as bcrypt from 'bcrypt';
import { SQLITE_CLOUD } from './sqlitecloud.provider';
import { randomUUID } from 'crypto';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(@Inject(SQLITE_CLOUD) private readonly db: Database) {}

  async onModuleInit() {
    await this.ensureSchema();
    await this.ensureSeedData();
  }

  get connection() {
    return this.db;
  }

  private async ensureSchema() {
    const distPath = join(__dirname, 'schema.sql');
    const srcPath = join(
      process.cwd(),
      'apps',
      'api',
      'src',
      'app',
      'database',
      'schema.sql'
    );
    const schemaPath = existsSync(distPath) ? distPath : srcPath;
    const sql = readFileSync(schemaPath, 'utf8');
    await this.db.exec(sql);
    await this.ensureTaskColumns();
    await this.ensureIdempotencyTable();
  }

  private async ensureTaskColumns() {
    const columns = (await this.db.sql(
      "PRAGMA table_info('tasks')"
    )) as { name: string }[];
    const names = new Set(columns.map((col: { name: string }) => col.name));
    if (!names.has('priority')) {
      await this.db.exec('ALTER TABLE tasks ADD COLUMN priority TEXT NULL');
    }
    if (!names.has('due_date')) {
      await this.db.exec('ALTER TABLE tasks ADD COLUMN due_date TEXT NULL');
    }
  }

  private async ensureIdempotencyTable() {
    await this.db.exec(`CREATE TABLE IF NOT EXISTS idempotency_keys (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      user_id TEXT NULL,
      request_hash TEXT NOT NULL,
      response_status INTEGER NULL,
      response_body TEXT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );`);
    await this.db.exec(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_unique ON idempotency_keys (key, method, path, user_id)'
    );
  }

  private async ensureSeedData() {
    const [{ count }] = (await this.db.sql(
      'SELECT COUNT(*) as count FROM organizations'
    )) as [{ count: number }];
    if (count > 0) {
      this.logger.log('Database already seeded, skipping.');
      return;
    }

    this.logger.log('Seeding database...');

    const now = new Date().toISOString();
    const parentOrgId = randomUUID();
    const childOrgId = randomUUID();

    await this.db.sql(
      'INSERT INTO organizations (id, name, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      parentOrgId,
      'Acme Corp',
      null,
      now,
      now
    );

    await this.db.sql(
      'INSERT INTO organizations (id, name, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      childOrgId,
      'Acme Engineering',
      parentOrgId,
      now,
      now
    );

    const hashedPassword = await bcrypt.hash('password123', 10);

    const ownerId = randomUUID();
    const adminId = randomUUID();
    const viewerId = randomUUID();

    await this.db.sql(
      'INSERT INTO users (id, email, password, name, role, organization_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ownerId,
      'owner@acme.com',
      hashedPassword,
      'Alice Owner',
      'owner',
      parentOrgId,
      now,
      now
    );

    await this.db.sql(
      'INSERT INTO users (id, email, password, name, role, organization_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      adminId,
      'admin@acme.com',
      hashedPassword,
      'Bob Admin',
      'admin',
      childOrgId,
      now,
      now
    );

    await this.db.sql(
      'INSERT INTO users (id, email, password, name, role, organization_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      viewerId,
      'viewer@acme.com',
      hashedPassword,
      'Carol Viewer',
      'viewer',
      childOrgId,
      now,
      now
    );

    this.logger.log('Seeding complete.');
  }
}
