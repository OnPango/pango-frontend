import { http } from '@/core/api';
import { env } from '@/core/config/env';
import type { LoginRequest, LoginResponse } from '@/features/auth/types/auth';
import type { User } from '@/shared/types/user';

const mockUser: User = {
  id: '1',
  name: 'Carlos Arango',
  email: 'carlosarango1107@outlook.com',
  roleName: 'Admin',
  areaId: '1',
  organizationId: '1',
  permissions: [
    'dashboard:view',
    'users:manage',
    'areas:manage',
    'products:manage',
    'warehouses:manage',
    'inventory:record',
    'requests:create',
    'requests:attend',
    'suppliers:manage',
    'forecast:view',
    'alerts:view',
    'movements:view',
    'movements:import-history',
  ],
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  if (env.useMock) {
    await delay(400);
    if (credentials.email && credentials.password) {
      return {
        user: mockUser,
        token: 'mock-token-123456',
      };
    }
    throw new Error('Credenciales inválidas');
  }

  const response = await http.post<LoginResponse>('/auth/login', credentials);
  return response.data;
}

export async function logout(): Promise<void> {
  if (env.useMock) {
    await delay(150);
    return;
  }
  await http.post('/auth/logout');
}
