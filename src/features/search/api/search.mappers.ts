import type { SearchGroup, SearchResults } from '../types/search.types';
import type { SearchResultDto } from './search.dto';

function mapGroup<D, T>(group: { items: D[]; total: number }, map: (item: D) => T): SearchGroup<T> {
  return { items: group.items.map(map), total: group.total };
}

const severityOf = (value: number): 1 | 2 | 3 => (value >= 3 ? 3 : value === 2 ? 2 : 1);

export function toSearchResults(dto: SearchResultDto): SearchResults {
  return {
    query: dto.query,
    products:
      dto.products &&
      mapGroup(dto.products, (p) => ({
        id: String(p.id),
        sku: p.sku,
        name: p.name,
        family: p.category,
      })),
    families:
      dto.categories &&
      mapGroup(dto.categories, (c) => ({
        id: String(c.id),
        name: c.name,
        parent: c.parent,
        isActive: c.isActive,
      })),
    warehouses: mapGroup(dto.warehouses, (w) => ({
      id: String(w.id),
      code: w.code,
      name: w.name,
      type: w.type === 'STORE' ? 'store' : 'warehouse',
    })),
    alerts:
      dto.alerts &&
      mapGroup(dto.alerts, (a) => ({
        id: String(a.id),
        severity: severityOf(a.severity),
        product: { id: String(a.product.id), sku: a.product.sku, name: a.product.name },
        warehouse: { id: String(a.warehouse.id), name: a.warehouse.name },
      })),
    users:
      dto.users &&
      mapGroup(dto.users, (u) => ({
        id: String(u.id),
        name: u.name,
        email: u.email,
        jobTitle: u.jobTitle,
        isActive: u.isActive,
      })),
  };
}
