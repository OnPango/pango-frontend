import { Dropdown, type DropdownProps } from './Dropdown';

export interface MultiSelectProps extends Pick<
  DropdownProps,
  | 'id'
  | 'label'
  | 'hint'
  | 'error'
  | 'required'
  | 'optional'
  | 'disabled'
  | 'size'
  | 'className'
  | 'aria-label'
  | 'options'
  | 'searchable'
  | 'searchPlaceholder'
  | 'emptyMessage'
> {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  /** How many chips to show before collapsing the rest into "+n". */
  maxChips?: number;
}

/** Several choices from a list. The popup stays open while picking. */
export function MultiSelect({
  value,
  onChange,
  placeholder = 'Selecciona una o más opciones',
  maxChips = 2,
  options,
  ...rest
}: MultiSelectProps) {
  const chosen = options.filter((o) => value.includes(o.value));
  const shown = chosen.slice(0, maxChips);
  const extra = chosen.length - shown.length;

  return (
    <Dropdown
      {...rest}
      multiple
      options={options}
      selected={value}
      onToggle={(v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])}
      onClear={() => onChange([])}
      display={
        chosen.length === 0 ? (
          <span className="truncate text-muted">{placeholder}</span>
        ) : (
          <span className="flex min-w-0 flex-wrap items-center gap-1.5 py-1">
            {shown.map((o) => (
              <span
                key={o.value}
                className="max-w-36 truncate rounded-md border border-line2 bg-fg/5 px-2 py-0.5 text-xs font-medium"
              >
                {o.label}
              </span>
            ))}
            {extra > 0 && <span className="text-xs font-semibold text-muted">+{extra}</span>}
          </span>
        )
      }
    />
  );
}
