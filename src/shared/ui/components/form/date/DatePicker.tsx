import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import { cn } from '@/shared/lib/cn';
import { controlStyles } from '../control.styles';
import { Field } from '../Field';
import { useDismiss } from '../useDismiss';
import { useFieldIds } from '../useFieldIds';
import {
  WEEKDAYS,
  addDays,
  addMonths,
  buildMonth,
  formatLongDate,
  formatMonth,
  formatShortDate,
  isSameMonth,
  parseISODate,
  startOfMonth,
  toISODate,
} from './date.utils';

export interface DatePickerProps {
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  /** Local date as `YYYY-MM-DD`, or `''` for none. */
  value: string;
  onChange: (value: string) => void;
  /** Earliest selectable day (`YYYY-MM-DD`). */
  min?: string;
  /** Latest selectable day (`YYYY-MM-DD`). */
  max?: string;
  placeholder?: string;
  clearable?: boolean;
  /** Accessible name when there is no visible `label` (a filter bar). */
  'aria-label'?: string;
}

/** Date field with a month calendar. Mondays first, Spanish (es-CO) labels, keyboard navigable. */
export function DatePicker({
  id: idProp,
  label,
  hint,
  error,
  required,
  optional,
  disabled = false,
  size = 'md',
  className,
  value,
  onChange,
  min,
  max,
  placeholder = 'dd/mm/aaaa',
  clearable = false,
  'aria-label': ariaLabel,
}: DatePickerProps) {
  const { id, hintId, errorId, describedBy } = useFieldIds(idProp, hint, error);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);

  const selected = parseISODate(value);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => startOfMonth(selected ?? new Date()));
  const [focused, setFocused] = useState(() => selected ?? new Date());
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');

  const closeMenu = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };
  useDismiss(rootRef, open, () => closeMenu(false));

  const isOutOfRange = (date: Date) => {
    const iso = toISODate(date);
    return (!!min && iso < min) || (!!max && iso > max);
  };

  const openMenu = () => {
    if (disabled) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom;
      setPlacement(below < 380 && rect.top > below ? 'top' : 'bottom');
    }
    const start = selected ?? new Date();
    setView(startOfMonth(start));
    setFocused(start);
    moveFocus.current = true;
    setOpen(true);
  };

  /** Moves the keyboard focus to `date`, switching month when needed. */
  const focusDate = (date: Date) => {
    if (isOutOfRange(date)) return;
    setFocused(date);
    setView(startOfMonth(date));
    moveFocus.current = true;
  };

  const pick = (date: Date) => {
    if (isOutOfRange(date)) return;
    onChange(toISODate(date));
    closeMenu();
  };

  // The roving-tabindex day: the focused one when it is in the visible month, otherwise the 1st.
  const tabbable = isSameMonth(focused, view) ? toISODate(focused) : toISODate(view);

  useEffect(() => {
    if (!open || !moveFocus.current) return;
    moveFocus.current = false;
    popupRef.current?.querySelector<HTMLButtonElement>(`[data-date="${tabbable}"]`)?.focus();
  }, [open, view, focused, tabbable]);

  const onDayKeyDown = (event: KeyboardEvent, date: Date) => {
    const moves: Record<string, Date> = {
      ArrowLeft: addDays(date, -1),
      ArrowRight: addDays(date, 1),
      ArrowUp: addDays(date, -7),
      ArrowDown: addDays(date, 7),
      PageUp: new Date(date.getFullYear(), date.getMonth() - 1, date.getDate()),
      PageDown: new Date(date.getFullYear(), date.getMonth() + 1, date.getDate()),
      Home: addDays(date, -((date.getDay() + 6) % 7)),
      End: addDays(date, 6 - ((date.getDay() + 6) % 7)),
    };
    if (event.key in moves) {
      event.preventDefault();
      focusDate(moves[event.key]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeMenu();
    }
  };

  const { leading, days } = buildMonth(view);
  const today = new Date();
  const todayISO = toISODate(today);
  const prevDisabled = !!min && toISODate(addDays(view, -1)) < min;
  const nextDisabled = !!max && toISODate(addMonths(view, 1)) > max;

  const navButton =
    'grid size-8 cursor-pointer place-items-center rounded-full text-fg transition hover:bg-fg/10 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

  return (
    <Field
      id={id}
      hintId={hintId}
      errorId={errorId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
      className={className}
    >
      <div ref={rootRef} className="relative">
        <button
          ref={triggerRef}
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-describedby={describedBy}
          onClick={() => (open ? closeMenu(false) : openMenu())}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && open) {
              e.preventDefault();
              e.stopPropagation();
              closeMenu();
            }
          }}
          className={cn(
            controlStyles({ size, invalid: !!error, disabled }),
            'cursor-pointer text-left',
            open && !error && 'border-primary ring-2 ring-primary/25',
          )}
        >
          <FiCalendar aria-hidden className="size-4 shrink-0 text-muted" />
          <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-muted')}>
            {selected ? formatShortDate(selected) : placeholder}
          </span>
          {clearable && selected && !disabled && (
            <span
              aria-hidden
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="grid size-5 shrink-0 place-items-center rounded-full text-muted hover:bg-fg/10 hover:text-fg"
            >
              <FiX className="size-3.5" />
            </span>
          )}
        </button>

        {open && (
          <div
            ref={popupRef}
            role="dialog"
            aria-label="Elegir fecha"
            className={cn(
              'absolute left-0 z-50 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-line2 bg-surface p-3 shadow-lg',
              placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                className={navButton}
                aria-label="Mes anterior"
                disabled={prevDisabled}
                onClick={() => setView(addMonths(view, -1))}
              >
                <FiChevronLeft className="size-4" />
              </button>
              <p aria-live="polite" className="text-sm font-semibold text-fg capitalize">
                {formatMonth(view)}
              </p>
              <button
                type="button"
                className={navButton}
                aria-label="Mes siguiente"
                disabled={nextDisabled}
                onClick={() => setView(addMonths(view, 1))}
              >
                <FiChevronRight className="size-4" />
              </button>
            </div>

            <div role="grid" aria-label={formatMonth(view)} className="grid grid-cols-7 gap-y-0.5">
              {WEEKDAYS.map((day) => (
                <span
                  key={day}
                  role="columnheader"
                  className="py-1 text-center text-[11px] font-semibold text-muted"
                >
                  {day}
                </span>
              ))}
              {Array.from({ length: leading }, (_, i) => (
                <span key={`gap-${i}`} aria-hidden />
              ))}
              {days.map((date) => {
                const iso = toISODate(date);
                const isSelected = !!selected && iso === value;
                const out = isOutOfRange(date);
                return (
                  <button
                    key={iso}
                    type="button"
                    role="gridcell"
                    data-date={iso}
                    tabIndex={iso === tabbable ? 0 : -1}
                    disabled={out}
                    aria-selected={isSelected}
                    aria-current={iso === todayISO ? 'date' : undefined}
                    aria-label={formatLongDate(date)}
                    onClick={() => pick(date)}
                    onKeyDown={(e) => onDayKeyDown(e, date)}
                    className={cn(
                      'mx-auto grid size-9 cursor-pointer place-items-center rounded-full text-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-35',
                      isSelected
                        ? 'bg-primary font-semibold text-primary-fg'
                        : 'text-fg hover:bg-fg/10 disabled:hover:bg-transparent',
                      !isSelected && iso === todayISO && 'border border-primary font-semibold',
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-line2 pt-2 text-xs font-semibold">
              <button
                type="button"
                disabled={isOutOfRange(today)}
                onClick={() => pick(today)}
                className="cursor-pointer rounded-md px-2 py-1 text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-40"
              >
                Hoy
              </button>
              {clearable && selected && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    closeMenu();
                  }}
                  className="cursor-pointer rounded-md px-2 py-1 text-muted hover:bg-fg/10 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-hidden"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Field>
  );
}
