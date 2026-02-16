export interface UserSummary {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'viewer';
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  items: UserSummary[];
  total: number;
  page: number;
  limit: number;
}
