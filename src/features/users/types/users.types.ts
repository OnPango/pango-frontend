import type { Permission } from '@/core/auth/user';

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  areaId: string;
  areaName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface ManagedRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  usersCount: number;
}

export interface ManagedArea {
  id: string;
  name: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  roleId: string;
  areaId: string;
  password?: string;
}

export interface UpdateUserInput {
  id: string;
  name: string;
  email: string;
  roleId: string;
  areaId: string;
  isActive: boolean;
  password?: string;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface UpdateRoleInput {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface PermissionMeta {
  key: Permission;
  label: string;
  description?: string;
  category: 'general' | 'operations' | 'supply' | 'admin';
  categoryLabel: string;
}

export const PERMISSION_DEFINITIONS: PermissionMeta[] = [
  {
    key: 'dashboard:view',
    label: 'Ver Dashboard',
    description: 'Acceso al resumen general e indicadores del sistema',
    category: 'general',
    categoryLabel: 'General',
  },
  {
    key: 'products:manage',
    label: 'Gestionar Productos',
    description: 'Crear, editar y listar catálogo de productos',
    category: 'operations',
    categoryLabel: 'Operaciones',
  },
  {
    key: 'warehouses:manage',
    label: 'Gestionar Almacenes',
    description: 'Administrar ubicaciones y bodegas',
    category: 'operations',
    categoryLabel: 'Operaciones',
  },
  {
    key: 'inventory:record',
    label: 'Registrar Inventario',
    description: 'Movimientos de entrada, salida y ajustes de stock',
    category: 'operations',
    categoryLabel: 'Operaciones',
  },
  {
    key: 'requests:create',
    label: 'Crear Solicitudes',
    description: 'Generar requerimientos de suministros o materiales',
    category: 'operations',
    categoryLabel: 'Operaciones',
  },
  {
    key: 'requests:attend',
    label: 'Atender Solicitudes',
    description: 'Aprobar, rechazar o despachar solicitudes',
    category: 'operations',
    categoryLabel: 'Operaciones',
  },
  {
    key: 'movements:view',
    label: 'Ver Movimientos',
    description: 'Consultar el histórico y kardex de transacciones',
    category: 'operations',
    categoryLabel: 'Operaciones',
  },
  {
    key: 'movements:import-history',
    label: 'Importar Historial',
    description: 'Carga masiva de datos y trazabilidad de importación',
    category: 'operations',
    categoryLabel: 'Operaciones',
  },
  {
    key: 'suppliers:manage',
    label: 'Gestionar Proveedores',
    description: 'Administración de compras y directorio de proveedores',
    category: 'supply',
    categoryLabel: 'Abastecimiento',
  },
  {
    key: 'forecast:view',
    label: 'Ver Predicciones',
    description: 'Consulta de proyecciones y demanda esperada',
    category: 'supply',
    categoryLabel: 'Abastecimiento',
  },
  {
    key: 'alerts:view',
    label: 'Ver Alertas',
    description: 'Visualización de stock bajo y avisos operativos',
    category: 'supply',
    categoryLabel: 'Abastecimiento',
  },
  {
    key: 'users:manage',
    label: 'Gestionar Usuarios',
    description: 'Alta, edición, roles y desactivación de usuarios',
    category: 'admin',
    categoryLabel: 'Administración',
  },
  {
    key: 'roles:manage',
    label: 'Gestionar Roles y Permisos',
    description: 'Creación de roles y asignación granular de accesos',
    category: 'admin',
    categoryLabel: 'Administración',
  },
  {
    key: 'areas:manage',
    label: 'Gestionar Áreas',
    description: 'Creación y configuración de áreas de trabajo',
    category: 'admin',
    categoryLabel: 'Administración',
  },
];
