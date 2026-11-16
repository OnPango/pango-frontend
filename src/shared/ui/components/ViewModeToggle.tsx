import { FiGrid, FiList } from 'react-icons/fi';
import type { ListView } from '@/shared/hooks/useListView';
import { SegmentedControl, type SegmentOption } from './form/SegmentedControl';

const VIEW_OPTIONS: SegmentOption<ListView>[] = [
  { value: 'table', label: 'Tabla', icon: FiList },
  { value: 'cards', label: 'Tarjetas', icon: FiGrid },
];

export interface ViewModeToggleProps {
  value: ListView;
  onChange: (value: ListView) => void;
  /** Accessible legend for the segmented radio group. */
  legend?: string;
  className?: string;
}

/** Shared toggle between table view and card grid view across catalog and management pages. */
export function ViewModeToggle({
  value,
  onChange,
  legend = 'Cambiar vista',
  className,
}: ViewModeToggleProps) {
  return (
    <SegmentedControl<ListView>
      legend={legend}
      options={VIEW_OPTIONS}
      value={value}
      onChange={onChange}
      className={className}
    />
  );
}
