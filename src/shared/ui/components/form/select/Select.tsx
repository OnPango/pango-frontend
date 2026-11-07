import { Dropdown, type DropdownProps } from './Dropdown';

export interface SelectProps extends Pick<
  DropdownProps,
  | 'id'
  | 'label'
  | 'hint'
  | 'error'
  | 'required'
  | 'disabled'
  | 'size'
  | 'className'
  | 'aria-label'
  | 'options'
  | 'searchable'
  | 'searchPlaceholder'
  | 'emptyMessage'
> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Shows an "x" to go back to no selection. Needs a form where "empty" is valid. */
  clearable?: boolean;
}

/** Single choice from a list. Value is the option's `value`; `''` means nothing selected. */
export function Select({
  value,
  onChange,
  placeholder = 'Selecciona una opción',
  clearable = false,
  options,
  ...rest
}: SelectProps) {
  const current = options.find((o) => o.value === value);

  return (
    <Dropdown
      {...rest}
      options={options}
      selected={current ? [current.value] : []}
      onToggle={onChange}
      onClear={clearable ? () => onChange('') : undefined}
      display={
        current ? (
          <span className="flex min-w-0 items-center gap-2">
            {current.icon}
            <span className="truncate">{current.label}</span>
          </span>
        ) : (
          <span className="truncate text-muted">{placeholder}</span>
        )
      }
    />
  );
}
