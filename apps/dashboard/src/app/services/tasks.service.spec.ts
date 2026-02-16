import { TestBed } from '@angular/core/testing';
import { TasksService } from './tasks.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

const sampleTask = {
  id: 't1',
  title: 'Test',
  description: '',
  status: 'todo',
  category: 'work',
  position: 0,
  assigneeId: 'u1',
  createdById: 'u1',
  organizationId: 'org',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('TasksService', () => {
  let service: TasksService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(TasksService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads tasks', () => {
    service.loadTasks();
    const req = httpMock.expectOne('/api/tasks');
    expect(req.request.method).toBe('GET');
    req.flush([sampleTask]);
    expect(service.tasks().length).toBe(1);
  });
});
