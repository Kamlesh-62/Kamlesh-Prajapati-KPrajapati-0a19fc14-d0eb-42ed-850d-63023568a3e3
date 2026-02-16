import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTaskRequestDto } from './dto/create-task.dto';
import { UpdateTaskRequestDto } from './dto/update-task.dto';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Role } from '@kprajapati/data';
import { AuditLogService } from '../audit/audit-log.service';
import { TasksRepository } from '../repositories/tasks.repository';
import { UsersRepository } from '../repositories/users.repository';
import { OrganizationsRepository } from '../repositories/organizations.repository';
import { randomUUID } from 'crypto';

@Injectable()
export class TasksService {
  constructor(
    private readonly tasks: TasksRepository,
    private readonly users: UsersRepository,
    private readonly organizations: OrganizationsRepository,
    private readonly auditLogService: AuditLogService
  ) {}

  private async getAccessibleOrgIds(user: AuthUser): Promise<string[]> {
    if (user.role !== Role.Owner) {
      return [user.organizationId];
    }

    const children = await this.organizations.findChildren(user.organizationId);
    return [user.organizationId, ...children.map((org) => org.id)];
  }

  private normalizeDateOnly(value: string) {
    return value.slice(0, 10);
  }

  private isPastDue(value: string) {
    const due = this.normalizeDateOnly(value);
    const today = new Date().toISOString().slice(0, 10);
    return due < today;
  }

  async list(
    user: AuthUser,
    params: {
      page: number;
      limit: number;
      status?: string;
      category?: string;
      assigneeId?: string;
      priority?: string;
      search?: string;
      sort?: 'none' | 'overdue_first' | 'due_soon';
    }
  ) {
    const orgIds = await this.getAccessibleOrgIds(user);
    const { items: rows, total } = await this.tasks.listByOrgIds({
      orgIds,
      status: params.status,
      category: params.category,
      assigneeId: params.assigneeId,
      priority: params.priority,
      search: params.search,
      page: params.page,
      limit: params.limit,
      sort: params.sort,
    });
    const overdueTasks = rows.filter(
      (task) =>
        task.due_date &&
        task.status !== 'done' &&
        task.status !== 'overdue' &&
        this.isPastDue(task.due_date)
    );
    if (overdueTasks.length) {
      await Promise.all(
        overdueTasks.map((task) => this.tasks.update(task.id, { status: 'overdue' }))
      );
      overdueTasks.forEach((task) => {
        task.status = 'overdue';
      });
    }
    return {
      items: rows.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        category: task.category,
        position: task.position,
        assigneeId: task.assignee_id,
        priority: task.priority,
        dueDate: task.due_date,
        createdById: task.created_by_id,
        organizationId: task.organization_id,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      })),
      total,
      page: params.page,
      limit: params.limit,
    };
  }

  async create(user: AuthUser, dto: CreateTaskRequestDto) {
    const orgIds = await this.getAccessibleOrgIds(user);

    const assigneeId = dto.assigneeId ?? user.sub;
    const assignee = await this.users.findById(assigneeId);
    if (!assignee) {
      throw new BadRequestException('Assignee not found');
    }
    if (!orgIds.includes(assignee.organization_id)) {
      throw new ForbiddenException('Assignee not in accessible organization');
    }

    const resolvedStatus =
      dto.dueDate && this.isPastDue(dto.dueDate) && (dto.status ?? 'todo') !== 'done'
        ? 'overdue'
        : dto.status ?? 'todo';

    const saved = await this.tasks.create({
      id: randomUUID(),
      title: dto.title,
      description: dto.description ?? '',
      status: resolvedStatus,
      category: dto.category,
      position: 0,
      assignee_id: assignee.id,
      priority: dto.priority ?? null,
      due_date: dto.dueDate ?? null,
      created_by_id: user.sub,
      organization_id: assignee.organization_id,
    });

    await this.auditLogService.logAction({
      action: 'create_task',
      userId: user.sub,
      resourceType: 'task',
      resourceId: saved.id,
      details: `Created task: ${saved.title}`,
    });

    return {
      id: saved.id,
      title: saved.title,
      description: saved.description,
      status: saved.status,
      category: saved.category,
      position: saved.position,
      assigneeId: saved.assignee_id,
      priority: saved.priority,
      dueDate: saved.due_date,
      createdById: saved.created_by_id,
      organizationId: saved.organization_id,
      createdAt: saved.created_at,
      updatedAt: saved.updated_at,
    };
  }

  async update(user: AuthUser, taskId: string, dto: UpdateTaskRequestDto) {
    const task = await this.tasks.findById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const orgIds = await this.getAccessibleOrgIds(user);
    if (!orgIds.includes(task.organization_id)) {
      throw new ForbiddenException('Not allowed to access this task');
    }

    if (user.role !== Role.Admin && user.role !== Role.Owner) {
      if (task.created_by_id !== user.sub) {
        throw new ForbiddenException('Not allowed to update this task');
      }
    }

    if (dto.assigneeId) {
      const assignee = await this.users.findById(dto.assigneeId);
      if (!assignee) {
        throw new BadRequestException('Assignee not found');
      }
      if (!orgIds.includes(assignee.organization_id)) {
        throw new ForbiddenException('Assignee not in accessible organization');
      }
    }

    const fields: Record<string, unknown> = {};
    if (dto.title !== undefined) fields.title = dto.title;
    if (dto.description !== undefined) fields.description = dto.description;
    if (dto.status !== undefined) fields.status = dto.status;
    if (dto.category !== undefined) fields.category = dto.category;
    if (dto.position !== undefined) fields.position = dto.position;
    if (dto.assigneeId !== undefined) {
      const assignee = await this.users.findById(dto.assigneeId);
      if (!assignee) {
        throw new BadRequestException('Assignee not found');
      }
      if (!orgIds.includes(assignee.organization_id)) {
        throw new ForbiddenException('Assignee not in accessible organization');
      }
      fields.assignee_id = assignee.id;
      fields.organization_id = assignee.organization_id;
    }
    if (dto.priority !== undefined) fields.priority = dto.priority;
    if (dto.dueDate !== undefined) fields.due_date = dto.dueDate;
    const nextStatus = dto.status ?? task.status;
    const nextDueDate = dto.dueDate ?? task.due_date;
    if (nextDueDate && this.isPastDue(nextDueDate) && nextStatus !== 'done') {
      fields.status = 'overdue';
    }

    const saved = await this.tasks.update(task.id, fields);
    if (!saved) {
      throw new NotFoundException('Task not found');
    }

    await this.auditLogService.logAction({
      action: 'update_task',
      userId: user.sub,
      resourceType: 'task',
      resourceId: saved.id,
      details: `Updated task: ${saved.title}`,
    });

    return {
      id: saved.id,
      title: saved.title,
      description: saved.description,
      status: saved.status,
      category: saved.category,
      position: saved.position,
      assigneeId: saved.assignee_id,
      priority: saved.priority,
      dueDate: saved.due_date,
      createdById: saved.created_by_id,
      organizationId: saved.organization_id,
      createdAt: saved.created_at,
      updatedAt: saved.updated_at,
    };
  }

  async remove(user: AuthUser, taskId: string) {
    const task = await this.tasks.findById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const orgIds = await this.getAccessibleOrgIds(user);
    if (!orgIds.includes(task.organization_id)) {
      throw new ForbiddenException('Not allowed to access this task');
    }

    if (user.role !== Role.Admin && user.role !== Role.Owner) {
      throw new ForbiddenException('Not allowed to delete this task');
    }

    await this.tasks.remove(task.id);

    await this.auditLogService.logAction({
      action: 'delete_task',
      userId: user.sub,
      resourceType: 'task',
      resourceId: task.id,
      details: `Deleted task: ${task.title}`,
    });

    return { success: true };
  }
}
