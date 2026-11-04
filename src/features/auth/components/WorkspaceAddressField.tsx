import { forwardRef, type InputHTMLAttributes } from 'react';
import { WORKSPACE_DOMAIN } from '@/core/tenant/tenant';
import { TextBox } from '@/shared/ui/components/form/TextBox';

interface WorkspaceAddressFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Validation or server error for the address (taken, reserved, malformed). */
  error?: string;
  label?: string;
}

/** Subdomain input with the `.onpango.com` suffix. Forwards its ref, so it works with `register`. */
export const WorkspaceAddressField = forwardRef<HTMLInputElement, WorkspaceAddressFieldProps>(
  function WorkspaceAddressField({ error, label = 'Dirección de tu espacio', ...inputProps }, ref) {
    return (
      <TextBox
        ref={ref}
        label={label}
        required
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="tuempresa"
        hint="Es donde tú y tu equipo entran. Solo minúsculas, números y guiones."
        error={error}
        trailing={
          <span className="shrink-0 rounded-lg bg-fg/5 px-2.5 py-1 text-sm font-semibold text-muted">
            .{WORKSPACE_DOMAIN}
          </span>
        }
        {...inputProps}
      />
    );
  },
);
