/** One group of `GET /search`: a few matches and how many there are in all. */
export interface SearchGroup<T> {
  items: T[];
  total: number;
}

export interface ProductMatch {
  id: string;
  sku: string;
  name: string;
  family: string;
}

export interface FamilyMatch {
  id: string;
  name: string;
  /** The family it hangs from; null for a top-level one. */
  parent: string | null;
  isActive: boolean;
}

export interface WarehouseMatch {
  id: string;
  code: string;
  name: string;
  type: 'warehouse' | 'store';
}

export interface AlertMatch {
  id: string;
  severity: 1 | 2 | 3;
  product: { id: string; sku: string; name: string };
  warehouse: { id: string; name: string };
}

export interface UserMatch {
  id: string;
  name: string;
  email: string;
  jobTitle: string | null;
  isActive: boolean;
}

/** Each group is null when the user cannot read that module, so it is not shown at all. */
export interface SearchResults {
  query: string;
  products: SearchGroup<ProductMatch> | null;
  families: SearchGroup<FamilyMatch> | null;
  warehouses: SearchGroup<WarehouseMatch>;
  alerts: SearchGroup<AlertMatch> | null;
  users: SearchGroup<UserMatch> | null;
}
