import { FiAlertOctagon, FiAlertTriangle } from 'react-icons/fi';
import { Badge } from '@/shared/ui/components/Badge';
import { SEVERITY_LABELS } from '../content/alert.labels';
import type { AlertSeverity } from '../types/alerts.types';

/** The severity with an icon, never by color alone; its meaning goes in the tooltip. */
export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const { label, long, tone, appearance } = SEVERITY_LABELS[severity];
  return (
    <span title={long}>
      <Badge
        tone={tone}
        appearance={appearance}
        icon={severity === 3 ? FiAlertOctagon : FiAlertTriangle}
      >
        {label}
      </Badge>
    </span>
  );
}
