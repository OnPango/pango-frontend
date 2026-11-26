import type { Permission } from '@/core/auth/user';

export const PERMISSION_CATEGORIES = [
  { id: 'admin', label: 'Administración' },
  { id: 'catalog', label: 'Catálogo y proveedores' },
  { id: 'warehouse', label: 'Almacenes e inventario' },
  { id: 'movements', label: 'Movimientos y solicitudes' },
  { id: 'forecasting', label: 'Predicción y alertas' },
] as const;

export type PermissionCategoryId = (typeof PERMISSION_CATEGORIES)[number]['id'];

export interface PermissionMeta {
  label: string;
  description: string;
  category: PermissionCategoryId;
}

/**
 * Human description of every permission the frontend knows (`PERMISSION_SCOPES` in
 * `core/auth/user.ts`). Typed as a `Record`, so adding a permission there without describing it
 * here does not compile. Insertion order is the order shown in the UI.
 */
export const PERMISSION_CATALOG: Record<Permission, PermissionMeta> = {
  'user.read': {
    label: 'Ver usuarios',
    description: 'Consultar los usuarios de la organización',
    category: 'admin',
  },
  'user.manage': {
    label: 'Gestionar usuarios',
    description: 'Crear, editar y desactivar usuarios',
    category: 'admin',
  },
  'role.read': {
    label: 'Ver roles',
    description: 'Consultar los roles y sus permisos',
    category: 'admin',
  },
  'role.manage': {
    label: 'Gestionar roles',
    description: 'Crear y editar roles y sus asignaciones',
    category: 'admin',
  },
  'department.manage': {
    label: 'Gestionar áreas',
    description: 'Crear y editar las áreas de trabajo',
    category: 'admin',
  },
  'settings.manage': {
    label: 'Configurar la organización',
    description: 'Editar la configuración de la organización',
    category: 'admin',
  },
  'notification.manage': {
    label: 'Gestionar notificaciones',
    description: 'Configurar las reglas de notificación',
    category: 'admin',
  },

  'catalog.read': {
    label: 'Ver catálogo',
    description: 'Consultar el catálogo de productos',
    category: 'catalog',
  },
  'product.manage': {
    label: 'Gestionar productos',
    description: 'Crear y editar productos',
    category: 'catalog',
  },
  'category.manage': {
    label: 'Gestionar categorías',
    description: 'Crear y editar categorías',
    category: 'catalog',
  },
  'attribute.manage': {
    label: 'Gestionar atributos',
    description: 'Crear y editar atributos personalizados',
    category: 'catalog',
  },
  'supplier.manage': {
    label: 'Gestionar proveedores',
    description: 'Crear y editar proveedores y sus productos',
    category: 'catalog',
  },

  'warehouse.manage': {
    label: 'Gestionar almacenes',
    description: 'Crear y editar almacenes',
    category: 'warehouse',
  },
  'warehouse.read': {
    label: 'Ver almacén',
    description: 'Consultar un almacén',
    category: 'warehouse',
  },
  'location.manage': {
    label: 'Gestionar ubicaciones',
    description: 'Crear y editar niveles de ubicación y ubicaciones',
    category: 'warehouse',
  },
  'stock.read': {
    label: 'Ver existencias',
    description: 'Consultar saldos y disponibilidad de stock',
    category: 'warehouse',
  },
  'replenishment.manage': {
    label: 'Gestionar reposición',
    description: 'Editar los parámetros de reposición',
    category: 'warehouse',
  },

  'movement_type.manage': {
    label: 'Gestionar tipos de movimiento',
    description: 'Crear y editar tipos de movimiento',
    category: 'movements',
  },
  'movement.read': {
    label: 'Ver movimientos',
    description: 'Consultar los movimientos de inventario',
    category: 'movements',
  },
  'movement.create': {
    label: 'Registrar movimientos',
    description: 'Registrar movimientos en borrador',
    category: 'movements',
  },
  'movement.confirm': {
    label: 'Confirmar movimientos',
    description: 'Confirmar o despachar movimientos',
    category: 'movements',
  },
  'movement.receive': {
    label: 'Recibir transferencias',
    description: 'Recibir transferencias en tránsito',
    category: 'movements',
  },
  'movement.void': {
    label: 'Anular movimientos',
    description: 'Anular movimientos confirmados',
    category: 'movements',
  },
  'movement.import': {
    label: 'Importar historial de movimientos',
    description: 'Cargar movimientos pasados desde un archivo para los pronósticos',
    category: 'movements',
  },
  'inventory.import': {
    label: 'Importar inventario inicial',
    description:
      'Cargar desde un archivo las existencias de apertura, creando los productos, categorías y bodegas que falten',
    category: 'movements',
  },
  'stock_request.read': {
    label: 'Ver solicitudes',
    description: 'Consultar las solicitudes de productos',
    category: 'movements',
  },
  'stock_request.create': {
    label: 'Crear solicitudes',
    description: 'Crear solicitudes de productos',
    category: 'movements',
  },
  'stock_request.approve': {
    label: 'Gestionar solicitudes',
    description: 'Aprobar, rechazar o cancelar solicitudes',
    category: 'movements',
  },

  'forecast.run': {
    label: 'Ejecutar predicciones',
    description: 'Iniciar corridas de predicción',
    category: 'forecasting',
  },
  'forecast.read': {
    label: 'Ver predicciones',
    description: 'Consultar las predicciones de demanda',
    category: 'forecasting',
  },
  'alert.read': {
    label: 'Ver alertas',
    description: 'Consultar las alertas de reposición',
    category: 'forecasting',
  },
  'alert.resolve': {
    label: 'Resolver alertas',
    description: 'Resolver o descartar alertas',
    category: 'forecasting',
  },
};

const entries = Object.entries(PERMISSION_CATALOG) as [Permission, PermissionMeta][];

/** Permissions grouped by category, computed once instead of filtering on every render. */
export const PERMISSIONS_BY_CATEGORY = Object.fromEntries(
  PERMISSION_CATEGORIES.map(({ id }) => [
    id,
    entries.filter(([, meta]) => meta.category === id).map(([key]) => key),
  ]),
) as Record<PermissionCategoryId, Permission[]>;
