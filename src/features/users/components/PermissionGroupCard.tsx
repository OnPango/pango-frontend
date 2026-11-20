import type { Permission } from '@/core/auth/user';
import { Switch } from '@/shared/ui/components/form/Switch';
import { PERMISSION_CATALOG } from '../content/permissions.catalog';

interface PermissionGroupCardProps {
  title: string;
  permissions: Permission[];
  granted: readonly Permission[];
  disabled?: boolean;
  onToggle: (permission: Permission, granted: boolean) => void;
}

/** One category of the catalog: each permission with its description and an on / off switch. */
export function PermissionGroupCard({
  title,
  permissions,
  granted,
  disabled = false,
  onToggle,
}: PermissionGroupCardProps) {
  return (
    <section className="rounded-2xl border border-line bg-surface px-5 py-4 shadow-xs">
      <h3 className="mb-1 text-base font-bold text-fg">{title}</h3>
      <ul>
        {permissions.map((permission) => {
          const meta = PERMISSION_CATALOG[permission];
          return (
            <li key={permission} className="border-t border-line2 py-3 first:border-t-0">
              <Switch
                labelFirst
                disabled={disabled}
                label={meta.label}
                description={meta.description}
                checked={granted.includes(permission)}
                onChange={(e) => onToggle(permission, e.target.checked)}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
