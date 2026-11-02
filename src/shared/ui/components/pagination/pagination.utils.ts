export type PageItem = number | 'start-ellipsis' | 'end-ellipsis';

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

/**
 * Page buttons to render, with ellipses for long ranges. First and last pages are always present.
 * e.g. page 10 of 20 → [1, …, 9, 10, 11, …, 20]. A gap of a single page is shown as the page itself.
 */
export function getPageItems(page: number, totalPages: number, siblings = 1): PageItem[] {
  const maxWithoutEllipsis = siblings * 2 + 5;
  if (totalPages <= maxWithoutEllipsis) return range(1, totalPages);

  const left = Math.max(page - siblings, 1);
  const right = Math.min(page + siblings, totalPages);
  const showStartEllipsis = left > 3;
  const showEndEllipsis = right < totalPages - 2;
  const edgeCount = 3 + 2 * siblings;

  if (!showStartEllipsis && showEndEllipsis) {
    return [...range(1, edgeCount), 'end-ellipsis', totalPages];
  }
  if (showStartEllipsis && !showEndEllipsis) {
    return [1, 'start-ellipsis', ...range(totalPages - edgeCount + 1, totalPages)];
  }
  return [1, 'start-ellipsis', ...range(left, right), 'end-ellipsis', totalPages];
}

/** 1-based "from–to" of the items on a page, plus the total number of pages. */
export function getPageRange(page: number, pageSize: number, totalItems: number) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);
  return { from, to, totalPages, currentPage };
}
