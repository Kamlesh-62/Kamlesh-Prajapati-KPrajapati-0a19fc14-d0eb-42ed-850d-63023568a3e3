import { Injectable } from '@nestjs/common';
import { Database } from '@sqlitecloud/drivers';

export interface UserRow {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

@Injectable()
export class UsersRepository {
  private readonly ttlMs = 5 * 60 * 1000;
  private readonly byIdCache = new Map<string, CacheEntry<UserRow | null>>();
  private readonly byEmailCache = new Map<string, CacheEntry<UserRow | null>>();
  private readonly listCache = new Map<string, CacheEntry<{ items: UserRow[]; total: number }>>();

  constructor(private readonly db: Database) {}

  private getCache<T>(map: Map<string, CacheEntry<T>>, key: string) {
    const entry = map.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      map.delete(key);
      return null;
    }
    return entry.value;
  }

  private setCache<T>(map: Map<string, CacheEntry<T>>, key: string, value: T) {
    map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  private listCacheKey(params: {
    orgIds: string[];
    search?: string;
    page: number;
    limit: number;
  }) {
    return JSON.stringify({
      orgIds: [...params.orgIds].sort(),
      search: params.search ?? '',
      page: params.page,
      limit: params.limit,
    });
  }

  async findByEmail(email: string): Promise<UserRow | null> {
    const cached = this.getCache(this.byEmailCache, email);
    if (cached !== null) return cached;
    const rows = (await this.db.sql(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      email
    )) as UserRow[];
    const user = rows[0] ?? null;
    this.setCache(this.byEmailCache, email, user);
    if (user) this.setCache(this.byIdCache, user.id, user);
    return user;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const rows = (await this.db.sql(
      'SELECT COUNT(*) as count FROM users WHERE email = ?',
      email
    )) as { count: number }[];
    return (rows[0]?.count ?? 0) > 0;
  }

  async create(user: Omit<UserRow, 'created_at' | 'updated_at'>) {
    const now = new Date().toISOString();
    await this.db.sql(
      'INSERT INTO users (id, email, password, name, role, organization_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      user.id,
      user.email,
      user.password,
      user.name,
      user.role,
      user.organization_id,
      now,
      now
    );
    const created = { ...user, created_at: now, updated_at: now };
    this.setCache(this.byIdCache, created.id, created);
    this.setCache(this.byEmailCache, created.email, created);
    this.listCache.clear();
    return created;
  }

  async findById(id: string): Promise<UserRow | null> {
    const cached = this.getCache(this.byIdCache, id);
    if (cached !== null) return cached;
    const rows = (await this.db.sql(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      id
    )) as UserRow[];
    const user = rows[0] ?? null;
    this.setCache(this.byIdCache, id, user);
    if (user) this.setCache(this.byEmailCache, user.email, user);
    return user;
  }

  async listByOrgIds(params: {
    orgIds: string[];
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ items: UserRow[]; total: number }> {
    const { orgIds, search, page, limit } = params;
    if (orgIds.length === 0) {
      return { items: [], total: 0 };
    }
    const cacheKey = this.listCacheKey(params);
    const cached = this.getCache(this.listCache, cacheKey);
    if (cached) return cached;
    const where: string[] = [];
    const values: unknown[] = [];
    const placeholders = orgIds.map(() => '?').join(',');
    where.push(`organization_id IN (${placeholders})`);
    values.push(...orgIds);
    if (search) {
      where.push('(name LIKE ? OR email LIKE ?)');
      values.push(`%${search}%`, `%${search}%`);
    }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    const rows = (await this.db.sql(
      `SELECT * FROM users ${whereClause} ORDER BY name ASC LIMIT ? OFFSET ?`,
      ...values,
      limit,
      offset
    )) as UserRow[];
    const countRows = (await this.db.sql(
      `SELECT COUNT(*) as count FROM users ${whereClause}`,
      ...values
    )) as { count: number }[];
    const total = countRows[0]?.count ?? 0;
    const result = { items: rows, total };
    this.setCache(this.listCache, cacheKey, result);
    return result;
  }
}
