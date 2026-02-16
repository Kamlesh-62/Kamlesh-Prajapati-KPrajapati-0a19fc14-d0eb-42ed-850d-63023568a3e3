export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'viewer';
  organizationId: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}
