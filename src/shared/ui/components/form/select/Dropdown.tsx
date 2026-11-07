import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { FiCheck, FiChevronDown, FiSearch, FiX } from 'react-icons/fi';
import { cn } from '@/shared/lib/cn';
import { controlStyles } from '../control.styles';
import { Field } from '../Field';
import { useDismiss } from '../useDismiss';
import { useFieldIds } from '../useFieldIds';
import type { SelectOption } from './select.types';

export interface DropdownProps {
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  'aria-label'?: string;
  options: SelectOption[];
  selected: readonly string[];
  multiple?: boolean;
  /** Called when an option is activated (select it, or toggle it when `multiple`). */
  onToggle: (value: string) => void;
  /** When given, shows a clear button (single) or a "Limpiar" action (multiple). */
  onClear?: () => void;
  /** Content of the closed control: the selected label, chips, or the placeholder. */
  display: ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

const normalize = (text: string) => text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

/**
 * Engine behind `Select` and `MultiSelect`: a button that opens a listbox. Keyboard: ↑ ↓ Home End to
 * move, Enter / Space to choose, Esc to close. It does not render in a portal, so avoid placing it
 * inside a container with `overflow: hidden`.
 */
export function Dropdown({
  id: idProp,
  label,
  hint,
  error,
  required,
  disabled = false,
  size = 'md',
  className,
  'aria-label': ariaLabel,
  options,
  selected,
  multiple = false,
  onToggle,
  onClear,
  display,
  searchable = false,
  searchPlaceholder = 'Buscar…',
  emptyMessage = 'Sin resultados',
}: DropdownProps) {
  const { id, hintId, errorId, describedBy } = useFieldIds(idProp, hint, error);
  const listId = `${id}-listbox`;
  const optionId = (index: number) => `${id}-option-${index}`;

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const suppressClick = useRef(false);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');

  const visible = useMemo(() => {
    const needle = normalize(query.trim());
    return needle ? options.filter((o) => normalize(o.label).includes(needle)) : options;
  }, [options, query]);
  const activeIndex = Math.min(active, visible.length - 1);

  const closeMenu = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };
  useDismiss(rootRef, open, () => closeMenu(false));

  const openMenu = () => {
    if (disabled) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom;
      setPlacement(below < 300 && rect.top > below ? 'top' : 'bottom');
    }
    setQuery('');
    setActive(
      Math.max(
        options.findIndex((o) => selected.includes(o.value)),
        0,
      ),
    );
    setOpen(true);
  };

  useEffect(() => {
    if (open && searchable) searchRef.current?.focus();
  }, [open, searchable]);

  useEffect(() => {
    if (open) document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- optionId only depends on `id`
  }, [open, activeIndex, id]);

  const choose = (option: SelectOption | undefined) => {
    if (!option || option.disabled) return;
    onToggle(option.value);
    if (!multiple) closeMenu();
  };

  /** Next enabled option from `from` in direction `dir`, or `from` when none is left. */
  const step = (from: number, dir: 1 | -1) => {
    for (let i = from + dir; i >= 0 && i < visible.length; i += dir) {
      if (!visible[i].disabled) return i;
    }
    return from;
  };

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        if (!open) openMenu();
        else setActive(step(activeIndex, event.key === 'ArrowDown' ? 1 : -1));
        break;
      case 'Home':
      case 'End':
        if (!open || (searchable && event.target === searchRef.current)) break;
        event.preventDefault();
        setActive(event.key === 'Home' ? step(-1, 1) : step(visible.length, -1));
        break;
      case 'Enter':
      case ' ':
        if (event.key === ' ' && event.target === searchRef.current) break;
        event.preventDefault();
        suppressClick.current = true;
        if (!open) openMenu();
        else choose(visible[activeIndex]);
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          event.stopPropagation();
          closeMenu();
        }
        break;
      case 'Tab':
        if (open) setOpen(false);
        break;
    }
  };

  const onTriggerClick = () => {
    // Enter / Space were already handled on keydown; some browsers still fire a click afterwards.
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (open) closeMenu(false);
    else openMenu();
  };

  const hasSelection = selected.length > 0;
  const activeId = open && visible.length > 0 ? optionId(activeIndex) : undefined;

  const clearSingle = (event: MouseEvent) => {
    event.stopPropagation();
    onClear?.();
    triggerRef.current?.focus();
  };

  return (
    <Field
      id={id}
      hintId={hintId}
      errorId={errorId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <div ref={rootRef} className="relative">
        <button
          ref={triggerRef}
          id={id}
          type="button"
          role={searchable ? undefined : 'combobox'}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={!searchable ? activeId : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onClick={onTriggerClick}
          onKeyDown={onKeyDown}
          onKeyUp={() => setTimeout(() => (suppressClick.current = false), 0)}
          className={cn(
            controlStyles({ size, invalid: !!error, disabled }),
            'cursor-pointer text-left',
            open && !error && 'border-primary ring-2 ring-primary/25',
          )}
        >
          <span className="flex min-w-0 flex-1 items-center">{display}</span>
          {onClear && hasSelection && !multiple && !disabled && (
            // A button inside the trigger would be invalid HTML; this is a pointer-only shortcut
            // (the keyboard path is to pick the empty option / use the list).
            <span
              aria-hidden
              onClick={clearSingle}
              className="grid size-5 shrink-0 place-items-center rounded-full text-muted hover:bg-fg/10 hover:text-fg"
            >
              <FiX className="size-3.5" />
            </span>
          )}
          <FiChevronDown
            aria-hidden
            className={cn('size-4 shrink-0 text-muted transition-transform', open && 'rotate-180')}
          />
        </button>

        {open && (
          <div
            className={cn(
              'absolute left-0 z-50 w-full min-w-48 overflow-hidden rounded-xl border border-line2 bg-surface shadow-lg',
              placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
            )}
          >
            {searchable && (
              <div className="flex items-center gap-2 border-b border-line2 px-3">
                <FiSearch aria-hidden className="size-4 shrink-0 text-muted" />
                <input
                  ref={searchRef}
                  type="text"
                  role="combobox"
                  aria-label={searchPlaceholder}
                  aria-expanded
                  aria-controls={listId}
                  aria-activedescendant={activeId}
                  value={query}
                  placeholder={searchPlaceholder}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  onKeyDown={onKeyDown}
                  className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-fg outline-hidden placeholder:text-muted"
                />
              </div>
            )}

            <ul
              id={listId}
              role="listbox"
              aria-label={label ?? ariaLabel}
              aria-multiselectable={multiple || undefined}
              className="max-h-60 overflow-y-auto p-1"
            >
              {visible.length === 0 && (
                <li role="presentation" className="px-3 py-2.5 text-sm text-muted">
                  {emptyMessage}
                </li>
              )}
              {visible.map((option, index) => {
                const isSelected = selected.includes(option.value);
                return (
                  // Keyboard access lives on the trigger / search input (aria-activedescendant).
                  // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                  <li
                    key={option.value}
                    id={optionId(index)}
                    role="option"
                    tabIndex={-1}
                    aria-selected={isSelected}
                    aria-disabled={option.disabled || undefined}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseMove={() => !option.disabled && setActive(index)}
                    onClick={() => choose(option)}
                    className={cn(
                      'flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-fg',
                      index === activeIndex && 'bg-fg/8',
                      isSelected && 'font-semibold',
                      option.disabled && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    {multiple && (
                      <span
                        aria-hidden
                        className={cn(
                          'grid size-4.5 shrink-0 place-items-center rounded-md border text-primary-fg',
                          isSelected ? 'border-primary bg-primary' : 'border-line2 bg-surface',
                        )}
                      >
                        {isSelected && <FiCheck className="size-3" strokeWidth={3} />}
                      </span>
                    )}
                    {option.icon}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{option.label}</span>
                      {option.description && (
                        <span className="block truncate text-xs font-normal text-muted">
                          {option.description}
                        </span>
                      )}
                    </span>
                    {!multiple && isSelected && (
                      <FiCheck aria-hidden className="size-4 shrink-0 text-primary" />
                    )}
                  </li>
                );
              })}
            </ul>

            {multiple && (
              <div className="flex items-center justify-between border-t border-line2 px-3 py-2 text-xs text-muted">
                <span>
                  {selected.length} de {options.length} seleccionados
                </span>
                {onClear && hasSelection && (
                  <button
                    type="button"
                    onClick={onClear}
                    className="cursor-pointer font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Field>
  );
}
