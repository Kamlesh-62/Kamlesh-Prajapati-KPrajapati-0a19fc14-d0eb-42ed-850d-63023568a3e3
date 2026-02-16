import { TaskStatus } from '../enums/task-status.enum.js';
import { TaskCategory } from '../enums/task-category.enum.js';
import { TaskPriority } from '../enums/task-priority.enum.js';

export interface ITask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  category: TaskCategory;
  position: number;
  assigneeId: string;
  priority: TaskPriority | null;
  dueDate: string | null;
  organizationId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}
