import { Injectable } from '@nestjs/common';
import { Database } from '@sqlitecloud/drivers';

export interface TaskRow {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  position: number;
  assignee_id: string;
  priority: string | null;
  due_date: string | null;
  created_by_id: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class TasksRepository {
  constructor(private readonly db: Database) {}

  async listByOrgIds(params: {
    orgIds: string[];
    status?: string;
    category?: string;
    assigneeId?: string;
    priority?: string;
    search?: string;
    page: number;
    limit: number;
    sort?: 'none' | 'overdue_first' | 'due_soon';
  }): Promise<{ items: TaskRow[]; total: number }> {
    const { orgIds, status, category, assigneeId, priority, search, page, limit, sort } = params;
    if (orgIds.length === 0) return { items: [], total: 0 };
    const where: string[] = [];
    const values: unknown[] = [];
    const placeholders = orgIds.map(() => '?').join(',');
    where.push(`organization_id IN (${placeholders})`);
    values.push(...orgIds);
    if (status) {
      where.push('status = ?');
      values.push(status);
    }
    if (category) {
      where.push('category = ?');
      values.push(category);
    }
    if (assigneeId) {
      where.push('assignee_id = ?');
      values.push(assigneeId);
    }
    if (priority) {
      where.push('priority = ?');
      values.push(priority);
    }
    if (search) {
      where.push('(title LIKE ? OR description LIKE ?)');
      values.push(`%${search}%`, `%${search}%`);
    }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    let orderBy = 'ORDER BY position ASC, created_at DESC';
    if (sort === 'overdue_first') {
      orderBy =
        "ORDER BY CASE WHEN status = 'overdue' THEN 1 ELSE 0 END DESC, CASE WHEN due_date IS NULL THEN 1 ELSE 0 END ASC, due_date ASC, created_at DESC";
    } else if (sort === 'due_soon') {
      orderBy =
        'ORDER BY CASE WHEN due_date IS NULL THEN 1 ELSE 0 END ASC, due_date ASC, created_at DESC';
    }
    const rows = (await this.db.sql(
      `SELECT * FROM tasks ${whereClause} ${orderBy} LIMIT ? OFFSET ?`,
      ...values,
      limit,
      offset
    )) as TaskRow[];
    const countRows = (await this.db.sql(
      `SELECT COUNT(*) as count FROM tasks ${whereClause}`,
      ...values
    )) as { count: number }[];
    const total = countRows[0]?.count ?? 0;
    return { items: rows, total };
  }

  async findById(id: string): Promise<TaskRow | null> {
    const rows = (await this.db.sql(
      'SELECT * FROM tasks WHERE id = ? LIMIT 1',
      id
    )) as TaskRow[];
    return rows[0] ?? null;
  }

  async create(task: Omit<TaskRow, 'created_at' | 'updated_at'>) {
    const now = new Date().toISOString();
    await this.db.sql(
      'INSERT INTO tasks (id, title, description, status, category, position, assignee_id, priority, due_date, created_by_id, organization_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      task.id,
      task.title,
      task.description,
      task.status,
      task.category,
      task.position,
      task.assignee_id,
      task.priority,
      task.due_date,
      task.created_by_id,
      task.organization_id,
      now,
      now
    );
    return { ...task, created_at: now, updated_at: now };
  }

  async update(id: string, fields: Partial<Omit<TaskRow, 'id' | 'created_at' | 'updated_at'>>) {
    const keys = Object.keys(fields);
    if (keys.length === 0) {
      return this.findById(id);
    }

    const setClause = keys.map((key) => `${key} = ?`).join(', ');
    const values = keys.map((key) => (fields as any)[key]);
    const now = new Date().toISOString();

    await this.db.sql(
      `UPDATE tasks SET ${setClause}, updated_at = ? WHERE id = ?`,
      ...values,
      now,
      id
    );

    return this.findById(id);
  }

  async remove(id: string) {
    await this.db.sql('DELETE FROM tasks WHERE id = ?', id);
  }
}
