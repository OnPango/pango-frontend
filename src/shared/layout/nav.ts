import { GoHomeFill } from 'react-icons/go';
import { FaBoxArchive } from 'react-icons/fa6';
import { FaWarehouse } from 'react-icons/fa';
import { FaBoxes } from 'react-icons/fa';
import { RiGitPullRequestFill } from 'react-icons/ri';
import { FaTruck } from 'react-icons/fa';
import { HiOutlineSwitchHorizontal } from 'react-icons/hi';
import { FiUpload } from 'react-icons/fi';
import { BsShieldFillCheck } from 'react-icons/bs';
import { RxActivityLog } from 'react-icons/rx';
import { HiUsers } from 'react-icons/hi2';
import { HiBellAlert } from 'react-icons/hi2';
import { GoGraph } from 'react-icons/go';

import type { IconType } from 'react-icons';
import type { Permission } from '@/core/auth/user';

export interface NavItem {
  to: string;
  label: string;
  icon: IconType | null;
  /** Shown if the user has at least one. No value = visible to every authenticated user. */
  anyOf?: Permission[];
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'general',
    label: 'General',
    items: [{ to: '/', label: 'Inicio', icon: GoHomeFill, anyOf: [] }],
  },
  {
    id: 'operations',
    label: 'Operación',
    items: [
      { to: '/products', label: 'Productos', icon: FaBoxArchive, anyOf: ['products:manage'] },
      { to: '/warehouses', label: 'Almacenes', icon: FaWarehouse, anyOf: ['warehouses:manage'] },
      { to: '/inventory', label: 'Inventario', icon: FaBoxes, anyOf: ['inventory:record'] },
      {
        to: '/requests',
        label: 'Solicitudes',
        icon: RiGitPullRequestFill,
        anyOf: ['requests:create', 'requests:attend'],
      },
      {
        to: '/movements',
        label: 'Movimientos',
        icon: HiOutlineSwitchHorizontal,
        anyOf: ['movements:view'],
      },
    ],
  },
  {
    id: 'data',
    label: 'Datos',
    items: [
      {
        to: '/import-history',
        label: 'Importar historial',
        icon: FiUpload,
        anyOf: ['movements:import-history'],
      },
    ],
  },
  {
    id: 'admin',
    label: 'Administración',
    items: [
      { to: '/users', label: 'Usuarios', icon: HiUsers, anyOf: ['users:manage'] },
      {
        to: '/roles-permissions',
        label: 'Roles y Permisos',
        icon: BsShieldFillCheck,
        anyOf: ['roles:manage'],
      },
      { to: '/logbook', label: 'Bitácora', icon: RxActivityLog, anyOf: [] },
    ],
  },
  {
    id: 'supply',
    label: 'Abastecimiento',
    items: [
      { to: '/suppliers', label: 'Proveedores', icon: FaTruck, anyOf: ['suppliers:manage'] },
      { to: '/forecast', label: 'Predicción', icon: GoGraph, anyOf: ['forecast:view'] },
      { to: '/alerts', label: 'Alertas', icon: HiBellAlert, anyOf: ['alerts:view'] },
    ],
  },
];
