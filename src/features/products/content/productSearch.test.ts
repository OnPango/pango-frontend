import { describe, expect, it } from 'vitest';
import type { Product, ProductCategory } from '../types/products.types';
import { filterProducts } from './productSearch';

const category = (id: string, name: string, parentId: string | null = null): ProductCategory => ({
  id,
  name,
  description: null,
  parentId,
  isActive: true,
  productCount: 0,
});

const categories = [
  category('hw', 'Ferretería'),
  category('screws', 'Tornillería', 'hw'),
  category('m8', 'Métrica 8', 'screws'),
  category('paint', 'Pinturas'),
];

const product = (sku: string, name: string, categoryId: string, isActive = true): Product => ({
  id: sku,
  sku,
  name,
  description: null,
  category: { id: categoryId, name: categories.find((c) => c.id === categoryId)!.name },
  stockUnit: { id: '1', code: 'EA', name: 'Unidad' },
  lengthCm: null,
  widthCm: null,
  heightCm: null,
  weightKg: null,
  volumeL: null,
  tracksLots: false,
  isActive,
  createdAt: '2026-01-01T00:00:00Z',
});

const products = [
  product('TOR-008', 'Tornillo hexagonal M8', 'm8'),
  product('TOR-010', 'Tornillo hexagonal M10', 'screws'),
  product('MAR-001', 'Martillo de uña', 'hw', false),
  product('PIN-001', 'Pintura látex blanca', 'paint'),
];

const skus = (
  search: string,
  extra: { categoryId?: string; status?: 'all' | 'active' | 'inactive' } = {},
) =>
  filterProducts(products, categories, {
    search,
    categoryId: extra.categoryId ?? null,
    status: extra.status ?? 'all',
  }).map((p) => p.sku);

describe('filterProducts', () => {
  it('returns every product when there is no search or filter', () => {
    expect(skus('')).toEqual(['TOR-008', 'TOR-010', 'MAR-001', 'PIN-001']);
  });

  it('ignores accents and case', () => {
    expect(skus('PINTURA LATEX')).toEqual(['PIN-001']);
  });

  it('searches by code', () => {
    expect(skus('mar-001')).toEqual(['MAR-001']);
  });

  it('searches by the family and the families above it', () => {
    expect(skus('ferreteria')).toEqual(['TOR-008', 'TOR-010', 'MAR-001']);
    expect(skus('metrica')).toEqual(['TOR-008']);
  });

  it('requires every word, in any order', () => {
    expect(skus('m8 tornillo')).toEqual(['TOR-008']);
    expect(skus('tornillo pintura')).toEqual([]);
  });

  it('includes the subfamilies of the chosen family', () => {
    expect(skus('', { categoryId: 'screws' })).toEqual(['TOR-008', 'TOR-010']);
  });

  it('filters by status', () => {
    expect(skus('', { status: 'inactive' })).toEqual(['MAR-001']);
    expect(skus('', { status: 'active' })).toEqual(['TOR-008', 'TOR-010', 'PIN-001']);
  });

  it('combines search, family and status', () => {
    expect(skus('tornillo', { categoryId: 'hw', status: 'active' })).toEqual([
      'TOR-008',
      'TOR-010',
    ]);
  });
});
