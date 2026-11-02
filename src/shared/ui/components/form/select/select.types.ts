import type { ReactNode } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  /** Secondary line under the label. */
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
}
