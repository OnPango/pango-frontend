import type { Product, ProductCategory, ProductFilters } from '../types/products.types';
import { categoryPaths } from './catalog.labels';

/** Lowercase and without accents, so "ferreteria" finds "Ferretería". */
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/** The family and every subfamily below it. */
function withDescendants(categories: ProductCategory[], id: string): Set<string> {
  const ids = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const category of categories) {
      if (category.parentId && ids.has(category.parentId) && !ids.has(category.id)) {
        ids.add(category.id);
        grew = true;
      }
    }
  }
  return ids;
}

/**
 * The products matching the list's filters, in the order they came (by name). The search looks
 * at the code, the name and the family with the families above it, so "ferretería" also finds
 * the products of "Ferretería › Tornillería". Choosing a family includes its subfamilies.
 */
export function filterProducts(
  products: Product[],
  categories: ProductCategory[],
  filters: Pick<ProductFilters, 'search' | 'categoryId' | 'status'>,
): Product[] {
  const words = normalize(filters.search).split(/\s+/).filter(Boolean);
  const paths = categoryPaths(categories);
  const family = filters.categoryId ? withDescendants(categories, filters.categoryId) : null;

  return products.filter((product) => {
    if (filters.status === 'active' && !product.isActive) return false;
    if (filters.status === 'inactive' && product.isActive) return false;
    if (family && !family.has(product.category.id)) return false;
    if (words.length === 0) return true;
    const haystack = normalize(
      [product.sku, product.name, paths.get(product.category.id) ?? product.category.name].join(
        ' ',
      ),
    );
    // Every word must appear somewhere: "tornillo m8" or "m8 ferreteria".
    return words.every((word) => haystack.includes(word));
  });
}
