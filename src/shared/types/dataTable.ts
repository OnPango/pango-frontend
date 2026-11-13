import type { ReactNode } from 'react';

/**
 * What a cell looks like while the table loads, so the skeleton keeps the table's shape:
 * - `text`: one line (the default);
 * - `title`: a line and a shorter one below (a name and its code);
 * - `stack`: a line and two shorter ones (a number, its type and date);
 * - `badge`: a pill (status, priority);
 * - `button`: an action button;
 * - `avatar`: a circle beside a title (a person);
 * - `none`: empty.
 */
export type CellSkeleton = 'text' | 'title' | 'stack' | 'badge' | 'button' | 'avatar' | 'none';

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  skeleton?: CellSkeleton;
}
