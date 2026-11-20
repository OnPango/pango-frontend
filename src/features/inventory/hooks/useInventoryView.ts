import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { WarehouseOption } from '../types/inventory.types';

export type InventoryView = 'warehouse' | 'product';

const STORAGE_KEY = 'pango.inventory.view';

/** The last view the person chose on this device; a convenience, so failures are ignored. */
function readStoredView(): InventoryView | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'warehouse' || value === 'product' ? value : null;
  } catch {
    return null;
  }
}

function storeView(view: InventoryView) {
  try {
    localStorage.setItem(STORAGE_KEY, view);
  } catch {
    // Private mode or blocked storage: the view simply is not remembered.
  }
}

/**
 * Which view of the stock is shown and what is chosen in it, kept in the URL
 * (`?view=warehouse&warehouse=1`, `?view=product&product=12`) so a link opens the same view.
 *
 * Without `view`: a `product` in the URL (the link from Productos) means the product view; otherwise
 * the last view chosen here, else the warehouse view. With access to a single warehouse, that
 * warehouse is chosen for you.
 */
export function useInventoryView(warehouses: WarehouseOption[] | undefined) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [storedView] = useState(readStoredView);

  const productId = searchParams.get('product');
  const rawView = searchParams.get('view');
  const view: InventoryView =
    rawView === 'warehouse' || rawView === 'product'
      ? rawView
      : productId
        ? 'product'
        : searchParams.get('warehouse')
          ? 'warehouse'
          : (storedView ?? 'warehouse');
  const warehouseId =
    searchParams.get('warehouse') ?? (warehouses?.length === 1 ? warehouses[0].id : null);

  const update = useCallback(
    (changes: Record<string, string | null>) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value);
            else next.delete(key);
          }
          return next;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  const setView = useCallback(
    (next: InventoryView) => {
      storeView(next);
      update({ view: next });
    },
    [update],
  );

  return {
    view,
    setView,
    warehouseId,
    productId,
    setWarehouseId: useCallback((id: string) => update({ warehouse: id || null }), [update]),
    setProductId: useCallback((id: string) => update({ product: id || null }), [update]),
    /** From a row of the other view: switch view and choose what was clicked. */
    showWarehouse: useCallback(
      (id: string) => {
        storeView('warehouse');
        update({ view: 'warehouse', warehouse: id });
      },
      [update],
    ),
    showProduct: useCallback(
      (id: string) => {
        storeView('product');
        update({ view: 'product', product: id });
      },
      [update],
    ),
  };
}
