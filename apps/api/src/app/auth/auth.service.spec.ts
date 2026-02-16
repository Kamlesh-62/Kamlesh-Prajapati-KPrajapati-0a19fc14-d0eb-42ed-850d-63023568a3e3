import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from '../repositories/users.repository';
import { OrganizationsRepository } from '../repositories/organizations.repository';

const jwtService = {
  sign: jest.fn().mockReturnValue('token'),
} as unknown as JwtService;

describe('AuthService', () => {
  let users: UsersRepository;
  let orgs: OrganizationsRepository;
  let service: AuthService;

  beforeEach(() => {
    users = {
      findByEmail: jest.fn(),
      existsByEmail: jest.fn(),
      create: jest.fn(),
    } as unknown as UsersRepository;

    orgs = {
      existsById: jest.fn(),
    } as unknown as OrganizationsRepository;

    service = new AuthService(users, orgs, jwtService);
  });

  it('registers a user when org exists and email is unique', async () => {
    (orgs.existsById as jest.Mock).mockResolvedValue(true);
    (users.existsByEmail as jest.Mock).mockResolvedValue(false);
    (users.create as jest.Mock).mockResolvedValue({
      id: 'u1',
      email: 'test@example.com',
      name: 'Test',
      role: 'viewer',
      organization_id: 'org1',
    });

    const result = await service.register({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test',
      organizationId: 'org1',
    });

    expect(result.accessToken).toBe('token');
    expect(result.user.email).toBe('test@example.com');
  });

  it('throws on invalid login', async () => {
    (users.findByEmail as jest.Mock).mockResolvedValue(null);
    await expect(service.login('x@test.com', 'bad')).rejects.toThrow();
  });
});
