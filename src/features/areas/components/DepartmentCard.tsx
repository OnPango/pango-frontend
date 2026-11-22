import { MdEdit } from 'react-icons/md';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { EntityCard } from '@/shared/ui/components/EntityCard';
import type { Department } from '../types/areas.types';

export interface DepartmentCardProps {
  department: Department;
  /** Management actions shown only when user has `department.manage`. */
  onEdit?: (department: Department) => void;
  onToggleStatus?: (department: Department) => void;
}

/** Clean card representation for an organization department (área). */
export function DepartmentCard({ department, onEdit, onToggleStatus }: DepartmentCardProps) {
  return (
    <EntityCard
      title={department.name}
      subtitle={
        department.costCenter ? `Centro de costo: ${department.costCenter}` : 'Sin centro de costo'
      }
      badge={
        <Badge tone={department.isActive ? 'success' : 'neutral'} dot>
          {department.isActive ? 'Activa' : 'Inactiva'}
        </Badge>
      }
      footer={
        onEdit && onToggleStatus ? (
          <div className="flex w-full items-center justify-end gap-1">
            <Button
              variant="ghost"
              onClick={() => onToggleStatus(department)}
              className={`text-xs ${
                department.isActive
                  ? 'text-danger hover:bg-danger/10'
                  : 'text-success hover:bg-success/10'
              }`}
              aria-label={
                department.isActive
                  ? `Desactivar ${department.name}`
                  : `Reactivar ${department.name}`
              }
            >
              {department.isActive ? 'Desactivar' : 'Reactivar'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => onEdit(department)}
              className="gap-1.5 p-1.5 text-muted hover:text-fg"
              aria-label={`Editar ${department.name}`}
            >
              Editar
              <MdEdit aria-hidden className="size-4" />
            </Button>
          </div>
        ) : undefined
      }
    >
      <p className="text-sm text-fg/90">
        <span className="font-semibold tabular-nums">{department.userCount}</span>{' '}
        {department.userCount === 1 ? 'persona asignada' : 'personas asignadas'}
      </p>
    </EntityCard>
  );
}
