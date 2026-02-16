import { Component, computed, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TasksService } from '../../services/tasks.service';
import { AuthService } from '../../services/auth.service';
import { Task } from '../../models/task.models';
import { ThemeService } from '../../services/theme.service';
import { UsersService } from '../../services/users.service';
import { UserSummary } from '../../models/user.models';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './tasks.component.html',
})
export class TasksComponent implements OnDestroy {
  readonly filterStatus = signal<'all' | Task['status']>('all');
  readonly filterCategory = signal<'all' | Task['category']>('all');
  readonly sortBy = signal<'none' | 'overdue_first' | 'due_soon'>('none');
  readonly search = signal('');
  readonly showModal = signal(false);
  readonly editingTask = signal<Task | null>(null);
  readonly users = signal<UserSummary[]>([]);
  readonly usersLoading = signal(false);
  readonly usersError = signal<string | null>(null);
  readonly assigneeSearch = signal('');

  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private assigneeSearchTimer: ReturnType<typeof setTimeout> | null = null;

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    status: ['todo' as Task['status']],
    category: ['work' as Task['category']],
    priority: ['medium' as NonNullable<Task['priority']>],
    dueDate: [''],
    assigneeId: [''],
  });

  readonly tasks = computed(() => this.tasksService.tasks());
  readonly user = computed(() => this.auth.user());
  readonly canEdit = computed(() => {
    const role = this.user()?.role;
    return role === 'owner' || role === 'admin';
  });

  readonly filteredTasks = computed(() => this.tasks());
  readonly page = computed(() => this.tasksService.page());
  readonly limit = computed(() => this.tasksService.limit());
  readonly total = computed(() => this.tasksService.total());
  readonly totalPages = computed(() => Math.max(Math.ceil(this.total() / this.limit()), 1));

  readonly todoTasks = signal<Task[]>([]);
  readonly todoPage = signal(1);
  readonly todoTotal = signal(0);
  readonly todoTotalPages = computed(() => Math.max(Math.ceil(this.todoTotal() / this.limit()), 1));
  readonly inProgressTasks = signal<Task[]>([]);
  readonly inProgressPage = signal(1);
  readonly inProgressTotal = signal(0);
  readonly inProgressTotalPages = computed(() => Math.max(Math.ceil(this.inProgressTotal() / this.limit()), 1));
  readonly overdueTasks = signal<Task[]>([]);
  readonly overduePage = signal(1);
  readonly overdueTotal = signal(0);
  readonly overdueTotalPages = computed(() => Math.max(Math.ceil(this.overdueTotal() / this.limit()), 1));
  readonly doneTasks = signal<Task[]>([]);
  readonly donePage = signal(1);
  readonly doneTotal = signal(0);
  readonly doneTotalPages = computed(() => Math.max(Math.ceil(this.doneTotal() / this.limit()), 1));

  constructor(
    private readonly tasksService: TasksService,
    private readonly auth: AuthService,
    public readonly theme: ThemeService
  ) {
    this.loadUsers();
    this.refreshAllColumns();
  }

  ngOnDestroy() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    if (this.assigneeSearchTimer) {
      clearTimeout(this.assigneeSearchTimer);
    }
  }

  private loadUsers() {
    this.usersLoading.set(true);
    this.usersError.set(null);
    this.usersService.list({ limit: 200, search: this.assigneeSearch().trim() || undefined }).subscribe({
      next: (response) => {
        this.users.set(response.items);
        this.usersLoading.set(false);
      },
      error: () => {
        this.usersError.set('Failed to load users');
        this.usersLoading.set(false);
      },
    });
  }

  updateAssigneeSearch(value: string) {
    this.assigneeSearch.set(value);
    if (this.assigneeSearchTimer) clearTimeout(this.assigneeSearchTimer);
    this.assigneeSearchTimer = setTimeout(() => this.loadUsers(), 300);
  }

  private refreshTasks(page = 1) {
    this.tasksService.loadTasks({
      page,
      limit: this.limit(),
      status: this.filterStatus() === 'all' ? undefined : this.filterStatus(),
      category: this.filterCategory() === 'all' ? undefined : this.filterCategory(),
      search: this.search().trim() || undefined,
      sort: this.sortBy(),
    });
  }

  private refreshColumn(status: Task['status'], page: number) {
    this.tasksService
      .fetchTasks({
        page,
        limit: this.limit(),
        status,
        category: this.filterCategory() === 'all' ? undefined : this.filterCategory(),
        search: this.search().trim() || undefined,
        sort: this.sortBy(),
      })
      .subscribe({
        next: (response) => {
          if (status === 'todo') {
            this.todoTasks.set(response.items);
            this.todoTotal.set(response.total);
            this.todoPage.set(response.page);
          } else if (status === 'in_progress') {
            this.inProgressTasks.set(response.items);
            this.inProgressTotal.set(response.total);
            this.inProgressPage.set(response.page);
          } else if (status === 'overdue') {
            this.overdueTasks.set(response.items);
            this.overdueTotal.set(response.total);
            this.overduePage.set(response.page);
          } else if (status === 'done') {
            this.doneTasks.set(response.items);
            this.doneTotal.set(response.total);
            this.donePage.set(response.page);
          }
        },
      });
  }

  private refreshAllColumns() {
    const statusFilter = this.filterStatus();
    if (statusFilter !== 'all') {
      this.refreshColumn(statusFilter, 1);
      this.todoTasks.set([]);
      this.inProgressTasks.set([]);
      this.overdueTasks.set([]);
      this.doneTasks.set([]);
      return;
    }
    this.refreshColumn('todo', this.todoPage());
    this.refreshColumn('in_progress', this.inProgressPage());
    this.refreshColumn('overdue', this.overduePage());
    this.refreshColumn('done', this.donePage());
  }

  updateSearch(value: string) {
    this.search.set(value);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.todoPage.set(1);
      this.inProgressPage.set(1);
      this.overduePage.set(1);
      this.donePage.set(1);
      this.refreshAllColumns();
    }, 300);
  }

  openCreate() {
    this.editingTask.set(null);
    const currentUserId = this.user()?.id ?? '';
    this.form.reset({
      title: '',
      description: '',
      status: 'todo',
      category: 'work',
      priority: 'medium',
      dueDate: '',
      assigneeId: currentUserId,
    });
    this.showModal.set(true);
  }

  openEdit(task: Task) {
    this.editingTask.set(task);
    this.form.reset({
      title: task.title,
      description: task.description,
      status: task.status,
      category: task.category,
      priority: task.priority ?? 'medium',
      dueDate: task.dueDate ?? '',
      assigneeId: task.assigneeId ?? '',
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  save() {
    if (this.form.invalid) return;
    const raw = this.form.value;
    if (!raw.title || !raw.category) return;
    const payload = {
      title: raw.title,
      description: raw.description ?? '',
      status: raw.status ?? 'todo',
      category: raw.category,
      priority: raw.priority ?? 'medium',
      dueDate: raw.dueDate ? raw.dueDate : null,
      assigneeId: raw.assigneeId ? raw.assigneeId : undefined,
    };
    const current = this.editingTask();
    if (current) {
      this.tasksService.updateTask(current.id, payload).subscribe({
        next: () => this.refreshTasks(this.page()),
      });
    } else {
      this.tasksService.createTask(payload).subscribe({
        next: () => this.refreshTasks(1),
      });
    }
    this.showModal.set(false);
  }

  remove(task: Task) {
    this.tasksService.deleteTask(task.id).subscribe({
      next: () => this.refreshTasks(this.page()),
    });
  }

  handleDragStart(event: DragEvent, task: Task) {
    if (!this.canEdit()) return;
    event.dataTransfer?.setData('text/plain', task.id);
  }

  allowDrop(event: DragEvent) {
    event.preventDefault();
  }

  handleDrop(event: DragEvent, status: Task['status']) {
    event.preventDefault();
    if (!this.canEdit()) return;
    const id = event.dataTransfer?.getData('text/plain');
    if (!id) return;
    const task = this.tasks().find((t) => t.id === id);
    if (!task) return;
    if (task.status !== status) {
      this.tasksService.updateTask(task.id, { status });
    }
  }

  logout() {
    this.auth.logout();
  }

  goToPage(page: number) {
    const nextPage = Math.min(Math.max(page, 1), this.totalPages());
    this.refreshTasks(nextPage);
  }

  onFilterChange() {
    this.todoPage.set(1);
    this.inProgressPage.set(1);
    this.overduePage.set(1);
    this.donePage.set(1);
    this.refreshAllColumns();
  }

  goToColumnPage(status: Task['status'], page: number) {
    if (status === 'todo') this.refreshColumn('todo', page);
    if (status === 'in_progress') this.refreshColumn('in_progress', page);
    if (status === 'overdue') this.refreshColumn('overdue', page);
    if (status === 'done') this.refreshColumn('done', page);
  }
}
