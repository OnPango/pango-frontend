export type MetricTrend = 'up' | 'down';

export type MetricIconType = 'box' | 'stack' | 'alert' | 'cart';

export interface StatMetric {
  id: string;
  label: string;
  value: string;
  change: number;
  changePeriod: string;
  trend: MetricTrend;
  icon: MetricIconType;
}

export type ActivityType = 'new_product' | 'inventory_in' | 'order';

export interface RecentActivity {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  timeAgo: string;
}

export type StockStatus = 'critico' | 'preventivo' | 'normal';

export interface InventoryLevelItem {
  id: string;
  name: string;
  currentStock: number;
  reorderPoint: number;
  maxScale: number;
  status: StockStatus;
}

export interface ReplenishmentProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  reorderPoint: number;
  status: StockStatus;
  unit: string;
}
