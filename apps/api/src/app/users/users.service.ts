import { Injectable, ForbiddenException } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { OrganizationsRepository } from '../repositories/organizations.repository';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Role } from '@kprajapati/data';

@Injectable()
export class UsersService {
  constructor(
    private readonly users: UsersRepository,
    private readonly organizations: OrganizationsRepository
  ) {}

  private async getAccessibleOrgIds(user: AuthUser): Promise<string[]> {
    if (user.role !== Role.Owner) {
      return [user.organizationId];
    }

    const children = await this.organizations.findChildren(user.organizationId);
    return [user.organizationId, ...children.map((org) => org.id)];
  }

  async list(user: AuthUser, params: { page: number; limit: number; search?: string; orgId?: string }) {
    const orgIds = await this.getAccessibleOrgIds(user);
    if (params.orgId && !orgIds.includes(params.orgId)) {
      throw new ForbiddenException('Not allowed to access this organization');
    }

    const targetOrgs = params.orgId ? [params.orgId] : orgIds;
    const { items, total } = await this.users.listByOrgIds({
      orgIds: targetOrgs,
      search: params.search,
      page: params.page,
      limit: params.limit,
    });

    return {
      items: items.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        organizationId: u.organization_id,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
      })),
      total,
      page: params.page,
      limit: params.limit,
    };
  }
}
