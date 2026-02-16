import { TasksService } from './tasks.service';
import { TasksRepository } from '../repositories/tasks.repository';
import { UsersRepository } from '../repositories/users.repository';
import { OrganizationsRepository } from '../repositories/organizations.repository';
import { AuditLogService } from '../audit/audit-log.service';
import { Role } from '@kprajapati/data';

const auditLog = {
  logAction: jest.fn(),
} as unknown as AuditLogService;

describe('TasksService', () => {
  let tasksRepo: TasksRepository;
  let usersRepo: UsersRepository;
  let orgRepo: OrganizationsRepository;
  let service: TasksService;

  beforeEach(() => {
    tasksRepo = {
      listByOrgIds: jest.fn().mockResolvedValue([]),
    } as unknown as TasksRepository;
    usersRepo = {
      findById: jest.fn(),
    } as unknown as UsersRepository;
    orgRepo = {
      findChildren: jest.fn().mockResolvedValue([{ id: 'child-org' }]),
    } as unknown as OrganizationsRepository;

    service = new TasksService(tasksRepo, usersRepo, orgRepo, auditLog);
  });

  it('scopes viewer to own org', async () => {
    await service.list({ sub: 'u1', role: Role.Viewer, organizationId: 'org1' });
    expect(tasksRepo.listByOrgIds).toHaveBeenCalledWith(['org1']);
  });

  it('owner includes child orgs', async () => {
    await service.list({ sub: 'u1', role: Role.Owner, organizationId: 'org1' });
    expect(tasksRepo.listByOrgIds).toHaveBeenCalledWith(['org1', 'child-org']);
  });
});
