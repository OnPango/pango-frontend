import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { IoNotifications } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/auth.store';
import { hasAnyPermission } from '@/core/auth/permissions';
import { cn } from '@/shared/lib/cn';
import { formatNumber, formatQuantity } from '@/shared/lib/units';
import { Button } from '@/shared/ui/components/Button';
import { useDismiss } from '@/shared/ui/components/form/useDismiss';
import { Spinner } from '@/shared/ui/components/Spinner';
import { BELL_SIZE, usePendingAlerts } from '../api/alerts.queries';
import { SEVERITY_LABELS, timeAgo } from '../content/alert.labels';
import { alertsErrorMessage } from '../content/alerts.errors';

const SEVERITY_DOT = { 3: 'bg-danger', 2: 'bg-danger/60', 1: 'bg-warning' } as const;

/**
 * The header's bell: how many alerts are pending and the most recent ones, each opening its detail
 * in Alertas. Only for users who read alerts (`alert.read`); notifications proper are S7.
 */
export function AlertsBell() {
  const user = useAuthStore((state) => state.user);
  const readsAlerts = hasAnyPermission(user, ['alert.read']);
  const pending = usePendingAlerts(readsAlerts);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const close = useCallback(() => setIsOpen(false), []);
  useDismiss(rootRef, isOpen, close);

  // Opening it is a good moment to look again: alerts come from other people's movements too.
  const { refetch } = pending;
  useEffect(() => {
    if (isOpen) void refetch();
  }, [isOpen, refetch]);

  // Esc closes it and gives the focus back to the bell.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  if (!readsAlerts) return null;

  const total = pending.data?.total ?? 0;
  const items = pending.data?.items ?? [];
  const count = total > 99 ? '99+' : String(total);
  const go = (to: string) => {
    setIsOpen(false);
    navigate(to);
  };

  return (
    <div ref={rootRef} className="relative flex items-center justify-center">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        className="relative p-2 text-fg"
        aria-label={
          pending.isSuccess
            ? `Alertas: ${total === 0 ? 'ninguna pendiente' : total === 1 ? '1 pendiente' : `${total} pendientes`}`
            : 'Alertas'
        }
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((value) => !value)}
      >
        <IoNotifications aria-hidden className="size-5" />
        {total > 0 && (
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] leading-none font-bold text-canvas tabular-nums"
          >
            {count}
          </span>
        )}
      </Button>

      {isOpen && (
        <div
          id={panelId}
          role="region"
          aria-label="Alertas pendientes"
          // On a phone the bell is not at the edge (the avatar follows it): span the screen.
          className="fixed inset-x-4 top-18 z-40 animate-dialog-in overflow-hidden rounded-2xl border border-line bg-surface shadow-lg sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-88"
        >
          <div className="flex items-baseline justify-between gap-3 border-b border-line2 px-4 py-3">
            <p className="text-sm font-bold text-fg">Alertas pendientes</p>
            {pending.isSuccess && <p className="text-xs text-muted tabular-nums">{total}</p>}
          </div>

          {pending.isPending ? (
            <p className="flex items-center gap-2 px-4 py-6 text-sm text-muted" role="status">
              <Spinner className="size-4" /> Cargando alertas…
            </p>
          ) : pending.isError && items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-danger" role="alert">
              {alertsErrorMessage(pending.error, 'No se pudieron cargar las alertas.')}
            </p>
          ) : items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted">No hay alertas pendientes.</p>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-line2 overflow-y-auto">
              {items.map((alert) => (
                <li key={alert.id}>
                  <Button
                    variant="ghost"
                    className="flex w-full items-start justify-start gap-3 rounded-none px-4 py-3 text-left font-normal"
                    onClick={() => go(`/alerts?alert=${alert.id}`)}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'mt-1.5 size-2 shrink-0 rounded-full',
                        SEVERITY_DOT[alert.severity],
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-fg">
                        {alert.product.name}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        <span className="font-semibold text-fg/80">
                          {SEVERITY_LABELS[alert.severity].label}
                        </span>{' '}
                        · {alert.warehouse.name}
                      </span>
                      <span className="block text-xs text-muted tabular-nums">
                        Disponible {formatNumber(alert.available)} /{' '}
                        {formatQuantity(alert.reorderPoint, alert.product.unit)}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] text-muted">
                      {timeAgo(alert.createdAt)}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-line2 p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-primary"
              onClick={() => go('/alerts')}
            >
              {total > BELL_SIZE ? `Ver las ${total} pendientes` : 'Ver todas las alertas'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
