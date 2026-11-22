import type { IconType } from 'react-icons';
import { FiAlertTriangle, FiArchive, FiFolder, FiPackage, FiUser } from 'react-icons/fi';
import type { SearchGroup, SearchResults } from '../types/search.types';

/** One row of the results: where it leads and how it reads. */
export interface SearchOption {
  /** Unique among every option shown (it becomes the element id). */
  key: string;
  title: string;
  detail: string;
  to: string;
  icon: IconType;
  /** The "see all" row closing a group. */
  isMore?: boolean;
}

export interface SearchSection {
  key: string;
  label: string;
  options: SearchOption[];
}

const SEVERITY = { 3: 'Crítica', 2: 'Alta', 1: 'Media' } as const;
const WAREHOUSE_TYPE = { warehouse: 'Bodega', store: 'Tienda' } as const;

const query = (params: Record<string, string>) => `?${new URLSearchParams(params).toString()}`;

/** "Ver los 12 productos", only when the group has more matches than it shows. */
function more<T>(section: string, group: SearchGroup<T>, noun: string, to: string): SearchOption[] {
  if (group.total <= group.items.length) return [];
  return [
    {
      key: `${section}-more`,
      title: `Ver los ${group.total} ${noun}`,
      detail: '',
      to,
      icon: FiFolder,
      isMore: true,
    },
  ];
}

/** The groups with matches, in the order they are shown; a group the user cannot read is left out. */
export function toSections(results: SearchResults): SearchSection[] {
  const text = results.query;
  const sections: SearchSection[] = [];

  const { products, families, warehouses, alerts, users } = results;
  if (products?.items.length) {
    sections.push({
      key: 'products',
      label: 'Productos',
      options: [
        ...products.items.map((product) => ({
          key: `product-${product.id}`,
          title: product.name,
          detail: `${product.sku} · ${product.family}`,
          to: `/products${query({ product: product.id })}`,
          icon: FiPackage,
        })),
        ...more('products', products, 'productos', `/products${query({ search: text })}`),
      ],
    });
  }
  if (families?.items.length) {
    sections.push({
      key: 'families',
      label: 'Familias',
      options: families.items.map((family) => ({
        key: `family-${family.id}`,
        title: family.name,
        detail: [
          family.parent ? `Dentro de ${family.parent}` : 'Familia principal',
          !family.isActive && 'inactiva',
        ]
          .filter(Boolean)
          .join(' · '),
        to: `/products${query({ category: family.id })}`,
        icon: FiFolder,
      })),
    });
  }
  if (warehouses.items.length) {
    sections.push({
      key: 'warehouses',
      label: 'Almacenes',
      options: [
        ...warehouses.items.map((warehouse) => ({
          key: `warehouse-${warehouse.id}`,
          title: warehouse.name,
          detail: `${warehouse.code} · ${WAREHOUSE_TYPE[warehouse.type]}`,
          to: `/warehouses${query({ warehouse: warehouse.id })}`,
          icon: FiArchive,
        })),
        ...more('warehouses', warehouses, 'almacenes', `/warehouses${query({ search: text })}`),
      ],
    });
  }
  if (alerts?.items.length) {
    sections.push({
      key: 'alerts',
      label: 'Alertas pendientes',
      options: [
        ...alerts.items.map((alert) => ({
          key: `alert-${alert.id}`,
          title: alert.product.name,
          detail: `${SEVERITY[alert.severity]} · ${alert.warehouse.name}`,
          to: `/alerts${query({ alert: alert.id })}`,
          icon: FiAlertTriangle,
        })),
        ...more('alerts', alerts, 'alertas', '/alerts'),
      ],
    });
  }
  if (users?.items.length) {
    sections.push({
      key: 'users',
      label: 'Usuarios',
      options: [
        ...users.items.map((user) => ({
          key: `user-${user.id}`,
          title: user.name,
          detail: [user.email, user.jobTitle, !user.isActive && 'inactivo']
            .filter(Boolean)
            .join(' · '),
          to: `/users${query({ search: user.email })}`,
          icon: FiUser,
        })),
        ...more('users', users, 'usuarios', `/users${query({ search: text })}`),
      ],
    });
  }
  return sections;
}
