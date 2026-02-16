import { Role } from '../enums/role.enum.js';

export interface IUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IUserPublic = Omit<IUser, 'password'>;
