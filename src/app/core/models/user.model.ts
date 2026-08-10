export type UserRole = 'front_desk' | 'admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  signature?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  user: User;
  redirectPath: string;
}

export interface LogoutRequest {
  sessionId: string;
}
