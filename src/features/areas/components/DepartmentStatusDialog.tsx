import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { Modal } from '@/shared/ui/components/Modal';
import { useUpdateDepartment } from '../api/areas.queries';
import { areasErrorMessage } from '../content/areas.errors';
import type { Department } from '../types/areas.types';

/** Confirms deactivating or reactivating an area, saying who it affects. */
export function DepartmentStatusDialog({
  department,
  onClose,
  onDone,
}: {
  department: Department;
  onClose: () => void;
  onDone: (department: Department) => void;
}) {
  const update = useUpdateDepartment();
  const deactivating = department.isActive;
  const people = department.userCount === 1 ? '1 persona' : `${department.userCount} personas`;

  return (
    <Modal
      title={
        deactivating ? `¿Desactivar «${department.name}»?` : `¿Reactivar «${department.name}»?`
      }
      size="sm"
      onClose={onClose}
      dismissible={!update.isPending}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={update.isPending}>
            Cancelar
          </Button>
          <Button
            variant={deactivating ? 'danger' : 'primary'}
            size="sm"
            isLoading={update.isPending}
            onClick={() =>
              update.mutate(
                { id: department.id, input: { isActive: !deactivating } },
                { onSuccess: onDone },
              )
            }
          >
            {deactivating ? 'Desactivar área' : 'Reactivar área'}
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        {update.isError && (
          <Alert tone="danger">
            {areasErrorMessage(update.error, 'No se pudo cambiar el estado del área.')}
          </Alert>
        )}
        {deactivating ? (
          <>
            <p>No se podrá asignar a nadie más.</p>
            {department.userCount > 0 && (
              <p className="text-fg/90">
                Tiene {people}: no podrán crear solicitudes hasta que la reactives o les asignes
                otra área.
              </p>
            )}
            <p className="text-muted">Sus solicitudes anteriores se conservan.</p>
          </>
        ) : (
          <p>Volverá a poder asignarse y sus personas podrán crear solicitudes.</p>
        )}
      </div>
    </Modal>
  );
}
