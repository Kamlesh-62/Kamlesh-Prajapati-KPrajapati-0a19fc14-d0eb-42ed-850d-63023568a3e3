import { Injectable } from '@nestjs/common';
import { Database } from '@sqlitecloud/drivers';
import { randomUUID, createHash } from 'crypto';

export interface IdempotencyRecord {
  key: string;
  method: string;
  path: string;
  user_id: string;
  request_hash: string;
  response_status: number | null;
  response_body: string | null;
  created_at: string;
  expires_at: string;
}

@Injectable()
export class IdempotencyService {
  private readonly ttlMs = 24 * 60 * 60 * 1000;

  constructor(private readonly db: Database) {}

  stableHash(payload: unknown) {
    const stable = this.stableStringify(payload);
    return createHash('sha256').update(stable).digest('hex');
  }

  private stableStringify(value: unknown): string {
    if (value === null || value === undefined) return 'null';
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stableStringify(item)).join(',')}]`;
    }
    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>).sort(
        ([a], [b]) => a.localeCompare(b)
      );
      return `{${entries
        .map(([key, val]) => `${JSON.stringify(key)}:${this.stableStringify(val)}`)
        .join(',')}}`;
    }
    return JSON.stringify(value);
  }

  async cleanupExpired() {
    const now = new Date().toISOString();
    await this.db.sql('DELETE FROM idempotency_keys WHERE expires_at <= ?', now);
  }

  async find(key: string, method: string, path: string, userId: string) {
    const rows = (await this.db.sql(
      'SELECT * FROM idempotency_keys WHERE key = ? AND method = ? AND path = ? AND user_id = ? LIMIT 1',
      key,
      method,
      path,
      userId
    )) as IdempotencyRecord[];
    return rows[0] ?? null;
  }

  async create(key: string, method: string, path: string, userId: string, requestHash: string) {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + this.ttlMs).toISOString();
    await this.db.sql(
      'INSERT INTO idempotency_keys (id, key, method, path, user_id, request_hash, response_status, response_body, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      randomUUID(),
      key,
      method,
      path,
      userId,
      requestHash,
      null,
      null,
      now,
      expiresAt
    );
  }

  async saveResponse(key: string, method: string, path: string, userId: string, status: number, body: unknown) {
    const serialized = JSON.stringify(body ?? null);
    await this.db.sql(
      'UPDATE idempotency_keys SET response_status = ?, response_body = ? WHERE key = ? AND method = ? AND path = ? AND user_id = ?',
      status,
      serialized,
      key,
      method,
      path,
      userId
    );
  }

  async delete(key: string, method: string, path: string, userId: string) {
    await this.db.sql(
      'DELETE FROM idempotency_keys WHERE key = ? AND method = ? AND path = ? AND user_id = ?',
      key,
      method,
      path,
      userId
    );
  }
}
