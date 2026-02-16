import { Role } from '@kprajapati/data';

export interface AuthUser {
  sub: string;
  role: Role;
  organizationId: string;
}
