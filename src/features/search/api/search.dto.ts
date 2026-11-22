/** `GET /search` as pango-core answers it (`docs/search.md`). */

interface GroupDto<T> {
  items: T[];
  total: number;
}

export interface SearchResultDto {
  query: string;
  products: GroupDto<{ id: number; sku: string; name: string; category: string }> | null;
  categories: GroupDto<{
    id: number;
    name: string;
    parent: string | null;
    isActive: boolean;
  }> | null;
  warehouses: GroupDto<{ id: number; code: string; name: string; type: 'WAREHOUSE' | 'STORE' }>;
  alerts: GroupDto<{
    id: number;
    severity: number;
    product: { id: number; sku: string; name: string };
    warehouse: { id: number; name: string };
  }> | null;
  users: GroupDto<{
    id: number;
    name: string;
    email: string;
    jobTitle: string | null;
    isActive: boolean;
  }> | null;
}
