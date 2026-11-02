import { lazy } from 'react';
import { FaBoxes, FaTruck, FaWarehouse } from 'react-icons/fa';
import { FaBoxArchive } from 'react-icons/fa6';
import { FiUpload } from 'react-icons/fi';
import { BsShieldFillCheck } from 'react-icons/bs';
import { GoGraph, GoHomeFill } from 'react-icons/go';
import { HiBellAlert, HiUsers } from 'react-icons/hi2';
import { HiOutlineSwitchHorizontal } from 'react-icons/hi';
import { RiGitPullRequestFill } from 'react-icons/ri';
import { RxActivityLog } from 'react-icons/rx';

import type { IconType } from 'react-icons';
import type { LazyPage } from './load';
import type { Permission } from '@/core/auth/user';
import type { NavSection } from '@/shared/layout/nav';

/** Order of the sections in the menu. */
const SECTIONS = [
  { id: 'general', label: 'General' },
  { id: 'operations', label: 'Operación' },
  { id: 'data', label: 'Datos' },
  { id: 'admin', label: 'Administración' },
  { id: 'supply', label: 'Abastecimiento' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

export interface AppRoute {
  path: string;
  /** Menu entry and header title. */
  label: string;
  icon: IconType;
  section: SectionId;
  /** The user needs at least one. Empty = every signed-in user. */
  anyOf: Permission[];
  Page: LazyPage;
}

const placeholder = (name: string): LazyPage =>
  lazy(() => Promise.resolve({ default: () => <div>{name}</div> }));

/**
 * The only place that says which screens exist: the router builds its routes from it, the menu
 * lists them (in this order, grouped by `section`) and the header takes the title from `label`.
 * A new screen is one entry here.
 */
export const APP_ROUTES: AppRoute[] = [
  {
    path: '/',
    label: 'Inicio',
    icon: GoHomeFill,
    section: 'general',
    anyOf: [],
    Page: lazy(() => import('@/features/dashboard/pages/DashboardPage')),
  },
  {
    path: '/products',
    label: 'Productos',
    icon: FaBoxArchive,
    section: 'operations',
    anyOf: ['catalog.read', 'product.manage'],
    Page: lazy(() => import('@/features/products/pages/ProductPage')),
  },
  {
    path: '/warehouses',
    label: 'Almacenes',
    icon: FaWarehouse,
    section: 'operations',
    anyOf: ['warehouse.read', 'warehouse.manage'],
    Page: lazy(() => import('@/features/warehouses/pages/WarehousesPage')),
  },
  {
    path: '/inventory',
    label: 'Inventario',
    icon: FaBoxes,
    section: 'operations',
    anyOf: ['stock.read'],
    Page: lazy(() => import('@/features/inventory/pages/InventoryPage')),
  },
  {
    path: '/requests',
    label: 'Solicitudes',
    icon: RiGitPullRequestFill,
    section: 'operations',
    anyOf: ['stock_request.read', 'stock_request.create', 'stock_request.approve'],
    Page: lazy(() => import('@/features/requests/pages/RequestsPage')),
  },
  {
    path: '/movements',
    label: 'Movimientos',
    icon: HiOutlineSwitchHorizontal,
    section: 'operations',
    anyOf: ['movement.read'],
    Page: placeholder('Movements'),
  },
  {
    path: '/import-history',
    label: 'Importar historial',
    icon: FiUpload,
    section: 'data',
    // The backend has no import permission yet: admin-only until it does.
    anyOf: ['settings.manage'],
    Page: placeholder('Import History'),
  },
  {
    path: '/users',
    label: 'Usuarios',
    icon: HiUsers,
    section: 'admin',
    anyOf: ['user.read', 'user.manage'],
    Page: lazy(() => import('@/features/users/pages/UsersPage')),
  },
  {
    path: '/roles-permissions',
    label: 'Roles y Permisos',
    icon: BsShieldFillCheck,
    section: 'admin',
    anyOf: ['role.read', 'role.manage'],
    Page: lazy(() => import('@/features/users/pages/RolesPermissionsPage')),
  },
  {
    path: '/logbook',
    label: 'Bitácora',
    icon: RxActivityLog,
    section: 'admin',
    // The backend has no audit permission yet: open to everyone for now.
    anyOf: [],
    Page: placeholder('Bitacora'),
  },
  {
    path: '/suppliers',
    label: 'Proveedores',
    icon: FaTruck,
    section: 'supply',
    anyOf: ['supplier.manage'],
    Page: lazy(() => import('@/features/suppliers/pages/SuppliersPage')),
  },
  {
    path: '/forecast',
    label: 'Predicción',
    icon: GoGraph,
    section: 'supply',
    anyOf: ['forecast.read', 'forecast.run'],
    Page: lazy(() => import('@/features/forecast/pages/ForecastPage')),
  },
  {
    path: '/alerts',
    label: 'Alertas',
    icon: HiBellAlert,
    section: 'supply',
    anyOf: ['alert.read', 'alert.resolve'],
    Page: lazy(() => import('@/features/alerts/pages/AlertsPage')),
  },
];

/** The menu, derived from the routes above. */
export const NAV_SECTIONS: NavSection[] = SECTIONS.map(({ id, label }) => ({
  id,
  label,
  items: APP_ROUTES.filter((route) => route.section === id).map((route) => ({
    to: route.path,
    label: route.label,
    icon: route.icon,
    anyOf: route.anyOf,
  })),
}));
