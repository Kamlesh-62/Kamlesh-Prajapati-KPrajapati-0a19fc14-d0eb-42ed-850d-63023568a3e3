export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'overdue' | 'done';
  category: 'work' | 'personal';
  priority: 'low' | 'medium' | 'high' | 'urgent' | null;
  dueDate: string | null;
  position: number;
  assigneeId: string;
  createdById: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskListResponse {
  items: Task[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: Task['status'];
  category: Task['category'];
  assigneeId?: string;
  priority?: Task['priority'];
  dueDate?: string | null;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: Task['status'];
  category?: Task['category'];
  position?: number;
  assigneeId?: string;
  priority?: Task['priority'];
  dueDate?: string | null;
}
