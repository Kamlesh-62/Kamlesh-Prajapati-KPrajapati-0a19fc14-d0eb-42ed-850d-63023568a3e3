import { Injectable, computed, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_BASE_URL } from './api.config';
import { CreateTaskRequest, Task, TaskListResponse, UpdateTaskRequest } from '../models/task.models';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly tasksSignal = signal<Task[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly totalSignal = signal(0);
  private readonly pageSignal = signal(1);
  private readonly limitSignal = signal(50);

  readonly tasks = computed(() => this.tasksSignal());
  readonly loading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());
  readonly total = computed(() => this.totalSignal());
  readonly page = computed(() => this.pageSignal());
  readonly limit = computed(() => this.limitSignal());

  constructor(private readonly http: HttpClient) {}

  fetchTasks(params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    assigneeId?: string;
    priority?: string;
    search?: string;
    sort?: 'none' | 'overdue_first' | 'due_soon';
  }) {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.category) httpParams = httpParams.set('category', params.category);
    if (params?.assigneeId) httpParams = httpParams.set('assigneeId', params.assigneeId);
    if (params?.priority) httpParams = httpParams.set('priority', params.priority);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.sort && params.sort !== 'none') httpParams = httpParams.set('sort', params.sort);
    return this.http.get<TaskListResponse>(`${API_BASE_URL}/tasks`, { params: httpParams });
  }

  loadTasks(params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    assigneeId?: string;
    priority?: string;
    search?: string;
    sort?: 'none' | 'overdue_first' | 'due_soon';
  }) {
    this.loadingSignal.set(true);
    let httpParams = new HttpParams();
    const page = params?.page ?? this.pageSignal();
    const limit = params?.limit ?? this.limitSignal();
    httpParams = httpParams.set('page', String(page));
    httpParams = httpParams.set('limit', String(limit));
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.category) httpParams = httpParams.set('category', params.category);
    if (params?.assigneeId) httpParams = httpParams.set('assigneeId', params.assigneeId);
    if (params?.priority) httpParams = httpParams.set('priority', params.priority);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.sort && params.sort !== 'none') httpParams = httpParams.set('sort', params.sort);

    this.fetchTasks({
      page,
      limit,
      status: params?.status,
      category: params?.category,
      assigneeId: params?.assigneeId,
      priority: params?.priority,
      search: params?.search,
      sort: params?.sort,
    }).subscribe({
        next: (response) => {
          this.tasksSignal.set(response.items);
          this.totalSignal.set(response.total);
          this.pageSignal.set(response.page);
          this.limitSignal.set(response.limit);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.errorSignal.set('Failed to load tasks');
        this.loadingSignal.set(false);
      },
    });
  }

  createTask(payload: CreateTaskRequest) {
    return this.http.post<Task>(`${API_BASE_URL}/tasks`, payload);
  }

  updateTask(id: string, payload: UpdateTaskRequest) {
    return this.http.put<Task>(`${API_BASE_URL}/tasks/${id}`, payload);
  }

  deleteTask(id: string) {
    return this.http.delete(`${API_BASE_URL}/tasks/${id}`);
  }
}
