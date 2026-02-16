import { TaskStatus } from '../enums/task-status.enum.js';
import { TaskCategory } from '../enums/task-category.enum.js';
import { TaskPriority } from '../enums/task-priority.enum.js';

export interface CreateTaskDto {
  title: string;
  description: string;
  status?: TaskStatus;
  category: TaskCategory;
  assigneeId?: string;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  category?: TaskCategory;
  position?: number;
  assigneeId?: string;
  priority?: TaskPriority;
  dueDate?: string;
}
