/**
 * URL of a file in `public/`, independent of the current route. A relative path such as
 * `./logos/x.svg` resolves against the page URL, so it breaks on nested routes (`/products/12`).
 */
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\.?\//, '')}`;
}
