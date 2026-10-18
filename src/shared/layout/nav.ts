import { GoHomeFill } from "react-icons/go";
import { FaBoxArchive } from "react-icons/fa6";
import { FaWarehouse } from "react-icons/fa";
import { FaBoxes } from "react-icons/fa";
import { RiGitPullRequestFill } from "react-icons/ri";
import { FaTruck } from "react-icons/fa";

import type { IconType } from "react-icons";


import type { Permission } from '@/shared/types/user';

// export interface NavItem {
//   to: string;
//   label: string;
//   /** Shown if the user has at least one. No value = visible to every authenticated user. */
//   anyOf?: Permission[];
// }

// export const NAV_ITEMS: NavItem[] = [
//   { to: '/', label: 'Dashboard' },
//   { to: '/products', label: 'Productos', anyOf: ['products:manage'] }, //,anyOf: ['products:manage'] },
//   { to: '/warehouses', label: 'Almacenes' }, //,anyOf: ['warehouses:manage'] },
//   { to: '/inventory', label: 'Inventario' }, //,anyOf: ['inventory:record'] },
//   { to: '/requests', label: 'Solicitudes' }, //,anyOf: ['requests:create', 'requests:attend'] },
//   { to: '/suppliers', label: 'Proveedores y compras' }, //,anyOf: ['suppliers:manage'] },
//   { to: '/forecast', label: 'Predicción' }, //anyOf: ['forecast:view'] },
//   { to: '/alerts', label: 'Alertas' }, //anyOf: ['alerts:view'] },
//   { to: '/areas', label: 'Áreas' }, //anyOf: ['areas:manage'] },
//   { to: '/users', label: 'Usuarios' }, //anyOf: ['users:manage'] },
// ];

// export const name_item = () => {
//     switch (window.location.pathname) {
//         case '/':
//             return 'Dashboard';
//         case '/products':
//             return 'Productos';
//         case '/warehouses':
//             return 'Almacenes';
//         case '/inventory':
//             return 'Inventario';
//         case '/requests':
//             return 'Solicitudes';
//         case '/suppliers':
//             return 'Proveedores y compras';
//         case '/forecast':
//             return 'Predicción';
//         case '/alerts':
//             return 'Alertas';
//         case '/areas':
//             return 'Áreas';
//         case '/users':
//             return 'Usuarios';
//         default:
//             return 'PANGO';
//     }
// }

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
    items: [{ to: '/', label: 'Dashboard', icon: GoHomeFill, anyOf: ['dashboard:view'] }],
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
    ],
  },
  {
    id: 'supply',
    label: 'Abastecimiento',
    items: [
      {
        to: '/suppliers',
        label: 'Proveedores y compras',
        icon: FaTruck,
        anyOf: ['suppliers:manage'],
      },
      { to: '/forecast', label: 'Predicción', icon: null, anyOf: ['forecast:view'] },
      { to: '/alertas', label: 'Alertas', icon: null, anyOf: ['alerts:view'] },
    ],
  },
  {
    id: 'admin',
    label: 'Administración',
    items: [
      { to: '/areas', label: 'Áreas', icon: null, anyOf: ['areas:manage'] },
      { to: '/users', label: 'Usuarios', icon: null, anyOf: ['users:manage'] },
    ],
  },
];
