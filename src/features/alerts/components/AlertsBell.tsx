import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { FiAlertOctagon, FiAlertTriangle } from 'react-icons/fi';
import { IoNotifications } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/auth.store';
import { hasAnyPermission } from '@/core/auth/permissions';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/components/Button';
import { useDismiss } from '@/shared/ui/components/form/useDismiss';
import { Spinner } from '@/shared/ui/components/Spinner';
import { BELL_SIZE, usePendingAlerts } from '../api/alerts.queries';
import { SEVERITY_EVENTS, timeAgo } from '../content/alert.labels';
import { alertsErrorMessage } from '../content/alerts.errors';

/** The icon tile of each severity: octagon for "sin disponible", triangle for the warnings. */
const SEVERITY_TILE = {
  3: { icon: FiAlertOctagon, className: 'bg-danger/15 text-danger' },
  2: { icon: FiAlertTriangle, className: 'bg-danger/10 text-danger' },
  1: { icon: FiAlertTriangle, className: 'bg-warning/15 text-warning' },
} as const;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

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
            ? `Notificaciones: ${total === 0 ? 'ninguna alerta pendiente' : total === 1 ? '1 alerta pendiente' : `${total} alertas pendientes`}`
            : 'Notificaciones'
        }
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((value) => !value)}
      >
        <IoNotifications aria-hidden className="size-5" />
        {total > 0 && (
          <span
            aria-hidden
            className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-danger ring-2 ring-surface"
          />
        )}
      </Button>

      {isOpen && (
        <div
          id={panelId}
          role="region"
          aria-label="Notificaciones"
          // On a phone the bell is not at the edge (the avatar follows it): span the screen.
          className="fixed inset-x-4 top-18 z-40 animate-dialog-in overflow-hidden rounded-2xl border border-line2 bg-surface p-2 shadow-xl sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-85"
        >
          <div className="flex items-center justify-between gap-3 px-3 pt-2 pb-1.5">
            <p className="font-display text-base font-bold text-fg">Notificaciones</p>
            {pending.isSuccess && total > 0 && (
              <p className="text-[13px] font-medium text-muted tabular-nums">
                {total === 1 ? '1 pendiente' : `${count} pendientes`}
              </p>
            )}
          </div>

          {pending.isPending ? (
            <p className="flex items-center gap-2 px-3 py-6 text-sm text-muted" role="status">
              <Spinner className="size-4" /> Cargando alertas…
            </p>
          ) : pending.isError && items.length === 0 ? (
            <p className="px-3 py-6 text-sm text-danger" role="alert">
              {alertsErrorMessage(pending.error, 'No se pudieron cargar las alertas.')}
            </p>
          ) : items.length === 0 ? (
            <p className="px-3 py-6 text-sm text-muted">No hay alertas pendientes.</p>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto">
              {items.map((alert) => {
                const tile = SEVERITY_TILE[alert.severity];
                return (
                  <li key={alert.id}>
                    <Button
                      variant="ghost"
                      className="flex w-full items-start justify-start gap-3 rounded-xl p-3 text-left font-normal hover:bg-fg/5"
                      onClick={() => go(`/alerts?alert=${alert.id}`)}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'grid size-9.5 shrink-0 place-items-center rounded-[10px]',
                          tile.className,
                        )}
                      >
                        <tile.icon className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1 text-sm leading-snug text-fg">
                        <span className="font-bold">{alert.product.name}</span>{' '}
                        {SEVERITY_EVENTS[alert.severity]} en {alert.warehouse.name}
                        <span className="block text-[13px] font-medium text-muted">
                          {capitalize(timeAgo(alert.createdAt))}
                        </span>
                      </span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-1 border-t border-line2 px-3 pt-2 pb-1">
            <Button
              variant="ghost"
              size="sm"
              className="min-h-11 rounded-md px-0 text-sm text-primary hover:bg-transparent hover:underline"
              onClick={() => go('/alerts')}
            >
              {total > BELL_SIZE ? `Ver las ${total} pendientes →` : 'Ver todas las alertas →'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
