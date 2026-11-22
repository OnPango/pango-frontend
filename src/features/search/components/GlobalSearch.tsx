import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/components/Button';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { useDismiss } from '@/shared/ui/components/form/useDismiss';
import { Spinner } from '@/shared/ui/components/Spinner';
import { SEARCH_MIN_LENGTH, useSearchResults } from '../api/search.queries';
import { toSections, type SearchOption } from '../content/search.sections';

/** How long the text must stay still before it is sent: one request per pause, not per letter. */
const TYPING_PAUSE_MS = 400;

/**
 * The header's search: products, families, warehouses, pending alerts and users in one request,
 * sent once the user stops typing. Arrow keys move through the results, Enter opens one and Esc
 * closes the list. On a phone it starts as a button that opens the box over the header.
 */
export function GlobalSearch() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  /** Below `lg`: the box is open over the header. */
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();
  const listId = `${baseId}-results`;

  const typed = text.trim();
  const settled = useDebouncedValue(typed, TYPING_PAUSE_MS);
  const term = settled.length >= SEARCH_MIN_LENGTH ? settled : '';
  const search = useSearchResults(term);

  const sections = useMemo(
    () => (typed.length >= SEARCH_MIN_LENGTH && search.data ? toSections(search.data) : []),
    [typed, search.data],
  );
  const options = useMemo(() => sections.flatMap((section) => section.options), [sections]);
  const active = Math.min(activeIndex, options.length - 1);
  const optionId = (option: SearchOption) => `${baseId}-${option.key}`;

  /** Typing ahead of the last answer, or that answer still on its way. */
  const isWaiting = typed.length >= SEARCH_MIN_LENGTH && (typed !== settled || search.isFetching);
  const showPanel = isOpen && typed.length > 0;
  const showList = showPanel && options.length > 0;

  const close = useCallback(() => {
    setIsOpen(false);
    setIsExpanded(false);
  }, []);
  useDismiss(rootRef, isOpen || isExpanded, close);

  // The phone's box opens from a button: the cursor goes straight into it.
  useEffect(() => {
    if (isExpanded) inputRef.current?.focus();
  }, [isExpanded]);

  const choose = (option: SearchOption | undefined) => {
    if (!option) return;
    setText('');
    close();
    inputRef.current?.blur();
    navigate(option.to);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        if (options.length === 0) return;
        event.preventDefault();
        setIsOpen(true);
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setActiveIndex((active + step + options.length) % options.length);
        break;
      }
      case 'Enter':
        if (!showList) return;
        event.preventDefault();
        choose(options[active]);
        break;
      case 'Escape':
        event.preventDefault();
        if (showPanel) setIsOpen(false);
        else if (text) setText('');
        else close();
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="p-2 lg:hidden"
        aria-label="Buscar"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded(true)}
      >
        <FiSearch aria-hidden className="size-5" />
      </Button>

      <div
        ref={rootRef}
        role="search"
        className={cn(
          'relative lg:block lg:w-md',
          isExpanded
            ? 'fixed inset-x-2 top-2 z-50 rounded-2xl border border-line bg-surface p-2 shadow-xl lg:static lg:inset-auto lg:z-auto lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none'
            : 'hidden',
        )}
      >
        <TextBox
          ref={inputRef}
          type="search"
          name="search"
          id={`${baseId}-input`}
          role="combobox"
          aria-label="Buscar productos, familias, almacenes, alertas o usuarios"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={showList ? listId : undefined}
          aria-activedescendant={showList ? optionId(options[active]) : undefined}
          autoComplete="off"
          placeholder="Buscar producto, código o alerta..."
          leadingIcon={FiSearch}
          size="sm"
          shape="full"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={onKeyDown}
          trailing={
            <>
              {isWaiting && <Spinner className="size-4 text-muted" />}
              {isExpanded && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-1.5 lg:hidden"
                  aria-label="Cerrar la búsqueda"
                  onClick={close}
                >
                  <FiX aria-hidden className="size-4" />
                </Button>
              )}
            </>
          }
        />

        {showPanel && (
          <div className="absolute inset-x-0 top-full z-40 mt-2 max-h-[70vh] animate-dialog-in overflow-y-auto rounded-2xl border border-line2 bg-surface p-2 shadow-xl lg:right-auto lg:w-120">
            {typed.length < SEARCH_MIN_LENGTH ? (
              <p className="px-3 py-4 text-sm text-muted">
                Escribe al menos {SEARCH_MIN_LENGTH} letras para buscar.
              </p>
            ) : options.length > 0 ? (
              <ul
                id={listId}
                role="listbox"
                aria-label="Resultados de la búsqueda"
                aria-busy={isWaiting || undefined}
                className={cn('transition-opacity', isWaiting && 'opacity-60')}
              >
                {sections.map((section) => (
                  <li key={section.key} role="presentation">
                    <p
                      id={`${baseId}-${section.key}`}
                      className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-muted uppercase"
                    >
                      {section.label}
                    </p>
                    <ul role="group" aria-labelledby={`${baseId}-${section.key}`}>
                      {section.options.map((option) => {
                        const index = options.indexOf(option);
                        const Icon = option.icon;
                        return (
                          // Keyboard access lives on the input (aria-activedescendant).
                          // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                          <li
                            key={option.key}
                            id={optionId(option)}
                            role="option"
                            tabIndex={-1}
                            aria-selected={index === active}
                            onMouseDown={(event) => event.preventDefault()}
                            onMouseMove={() => setActiveIndex(index)}
                            onClick={() => choose(option)}
                            className={cn(
                              'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5',
                              index === active && 'bg-fg/8',
                            )}
                          >
                            {option.isMore ? (
                              <span className="pl-11 text-sm font-semibold text-primary">
                                {option.title} →
                              </span>
                            ) : (
                              <>
                                <span
                                  aria-hidden
                                  className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-canvas text-fg/80"
                                >
                                  <Icon className="size-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-semibold text-fg">
                                    {option.title}
                                  </span>
                                  <span className="block truncate text-xs text-muted">
                                    {option.detail}
                                  </span>
                                </span>
                              </>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            ) : isWaiting || search.isPending ? (
              <p className="flex items-center gap-2 px-3 py-4 text-sm text-muted" role="status">
                <Spinner className="size-4" /> Buscando…
              </p>
            ) : search.isError ? (
              <p className="px-3 py-4 text-sm text-danger" role="alert">
                No se pudo buscar. Revisa tu conexión e intenta de nuevo.
              </p>
            ) : (
              <p className="px-3 py-4 text-sm text-muted" role="status">
                Nada coincide con “{typed}”.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
