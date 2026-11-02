import type { IconType } from 'react-icons';
import type { Permission } from '@/core/auth/user';

export interface NavItem {
  to: string;
  label: string;
  icon: IconType | null;
  /** Shown if the user has at least one. Empty = visible to every authenticated user. */
  anyOf: Permission[];
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}
