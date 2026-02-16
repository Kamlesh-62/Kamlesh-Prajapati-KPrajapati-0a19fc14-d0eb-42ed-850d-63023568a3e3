import { Injectable } from '@nestjs/common';
import { Database } from '@sqlitecloud/drivers';
import { randomUUID } from 'crypto';

export interface OrganizationRow {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class OrganizationsRepository {
  private readonly ttlMs = 5 * 60 * 1000;
  private readonly existsCache = new Map<string, { value: boolean; expiresAt: number }>();
  private readonly childrenCache = new Map<string, { value: OrganizationRow[]; expiresAt: number }>();
  private readonly listCache = new Map<string, { value: {
    id: string;
    name: string;
    parentId: string | null;
    createdAt: string;
    updatedAt: string;
  }[]; expiresAt: number }>();

  constructor(private readonly db: Database) {}

  private getCache<T>(map: Map<string, { value: T; expiresAt: number }>, key: string) {
    const entry = map.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      map.delete(key);
      return null;
    }
    return entry.value;
  }

  private setCache<T>(map: Map<string, { value: T; expiresAt: number }>, key: string, value: T) {
    map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  async existsById(id: string): Promise<boolean> {
    const cached = this.getCache(this.existsCache, id);
    if (cached !== null) return cached;
    const rows = (await this.db.sql(
      'SELECT COUNT(*) as count FROM organizations WHERE id = ?',
      id
    )) as { count: number }[];
    const exists = (rows[0]?.count ?? 0) > 0;
    this.setCache(this.existsCache, id, exists);
    return exists;
  }

  async listAll(): Promise<
    {
      id: string;
      name: string;
      parentId: string | null;
      createdAt: string;
      updatedAt: string;
    }[]
  > {
    const cached = this.getCache(this.listCache, 'all');
    if (cached) return cached;
    const rows = (await this.db.sql(
      'SELECT id, name, parent_id as parentId, created_at as createdAt, updated_at as updatedAt FROM organizations ORDER BY name'
    )) as {
      id: string;
      name: string;
      parentId: string | null;
      createdAt: string;
      updatedAt: string;
    }[];
    this.setCache(this.listCache, 'all', rows);
    return rows;
  }

  async create(name: string, parentId: string | null = null) {
    const now = new Date().toISOString();
    const id = randomUUID();
    await this.db.sql(
      'INSERT INTO organizations (id, name, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      id,
      name,
      parentId,
      now,
      now
    );

    const created = {
      id,
      name,
      parentId,
      createdAt: now,
      updatedAt: now,
    };
    this.existsCache.set(id, { value: true, expiresAt: Date.now() + this.ttlMs });
    this.childrenCache.clear();
    this.listCache.delete('all');
    return created;
  }

  async findChildren(parentId: string): Promise<OrganizationRow[]> {
    const cached = this.getCache(this.childrenCache, parentId);
    if (cached) return cached;
    const rows = (await this.db.sql(
      'SELECT * FROM organizations WHERE parent_id = ?',
      parentId
    )) as OrganizationRow[];
    this.setCache(this.childrenCache, parentId, rows);
    return rows;
  }
}
