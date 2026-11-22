import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { getApiErrorCode } from '@/core/api/errors';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Modal } from '@/shared/ui/components/Modal';
import { useCreateDepartment, useUpdateDepartment } from '../api/areas.queries';
import { areasErrorMessage } from '../content/areas.errors';
import type { Department, UpdateDepartmentInput } from '../types/areas.types';
import {
  departmentSchema,
  EMPTY_DEPARTMENT_FORM,
  toDepartmentFormValues,
  type DepartmentFormValues,
} from '../types/department.schema';

const FORM_ID = 'department-form';

function DepartmentForm({
  department,
  onClose,
  onSaved,
}: {
  department?: Department;
  onClose: () => void;
  onSaved: (department: Department) => void;
}) {
  const isEdit = department !== undefined;
  const create = useCreateDepartment();
  const update = useUpdateDepartment();
  const mutation = isEdit ? update : create;
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    mode: 'onTouched',
    defaultValues: department ? toDepartmentFormValues(department) : EMPTY_DEPARTMENT_FORM,
  });

  const onError = (error: unknown) => {
    if (getApiErrorCode(error) === 'DEPARTMENT_NAME_TAKEN') {
      setError('name', { message: areasErrorMessage(error, '') }, { shouldFocus: true });
    }
  };

  const submit = handleSubmit((values) => {
    const input = { name: values.name.trim(), costCenter: values.costCenter.trim() || null };
    if (!department) {
      create.mutate(input, { onSuccess: onSaved, onError });
      return;
    }
    const changes: UpdateDepartmentInput = {};
    if (input.name !== department.name) changes.name = input.name;
    if (input.costCenter !== department.costCenter) changes.costCenter = input.costCenter;
    update.mutate({ id: department.id, input: changes }, { onSuccess: onSaved, onError });
  });

  const fieldError = getApiErrorCode(mutation.error) === 'DEPARTMENT_NAME_TAKEN';

  return (
    <Modal
      title={isEdit ? 'Editar área' : 'Nueva área'}
      description={
        isEdit
          ? department.name
          : 'Un área pide productos a los almacenes con solicitudes internas.'
      }
      size="sm"
      onClose={onClose}
      dismissible={!mutation.isPending}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            isLoading={mutation.isPending}
            disabled={isEdit && !isDirty}
          >
            {isEdit ? 'Guardar cambios' : 'Crear área'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={submit} noValidate className="space-y-5">
        {mutation.isError && !fieldError && (
          <Alert tone="danger">
            {areasErrorMessage(mutation.error, 'No se pudo guardar el área.')}
          </Alert>
        )}
        <TextBox
          label="Nombre"
          required
          maxLength={80}
          placeholder="Ej. Mantenimiento"
          hint="Único en la organización."
          error={errors.name?.message}
          {...register('name')}
        />
        <TextBox
          label="Centro de costo"
          optional
          maxLength={30}
          placeholder="Ej. CC-104"
          hint="Para cruzar los consumos con contabilidad."
          error={errors.costCenter?.message}
          {...register('costCenter')}
        />
      </form>
    </Modal>
  );
}

/** "Nueva área" and "Editar área". */
export function DepartmentFormModal({
  isOpen,
  department,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  department?: Department | null;
  onClose: () => void;
  onSaved: (department: Department) => void;
}) {
  if (!isOpen) return null;
  return (
    <DepartmentForm
      key={department?.id ?? 'new'}
      department={department ?? undefined}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}
