import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { getApiErrorCode } from '@/core/api/errors';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { FormSelect } from '@/shared/ui/components/form/FormSelect';
import { TextArea } from '@/shared/ui/components/form/TextArea';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Modal } from '@/shared/ui/components/Modal';
import { useCreateCategory, useUpdateCategory } from '../api/products.queries';
import { toCategorySelectOptions, withDescendants } from '../content/catalog.labels';
import { productsErrorMessage } from '../content/products.errors';
import {
  categorySchema,
  toCategoryFormValues,
  type CategoryFormValues,
} from '../types/category.schema';
import type { ProductCategory, UpdateCategoryInput } from '../types/products.types';

const FORM_ID = 'category-form';

const PARENT_ERRORS = ['CATEGORY_PARENT_INVALID', 'CATEGORY_CYCLE'];

const normalized = (name: string) => name.trim().toLocaleLowerCase('es');

interface CategoryFormProps {
  /** The family being edited; absent: a new one. */
  category?: ProductCategory;
  /** A new family starts under this one. */
  parentId?: string | null;
  /** Every family of the organization: the possible parents, and to keep names unique. */
  categories: ProductCategory[];
  onClose: () => void;
  onSaved: (category: ProductCategory) => void;
}

function CategoryForm({ category, parentId, categories, onClose, onSaved }: CategoryFormProps) {
  const isEdit = category !== undefined;
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const mutation = isEdit ? update : create;

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    mode: 'onTouched',
    defaultValues: toCategoryFormValues(category, parentId),
  });

  // An active family can go under another active one, never under itself or a subfamily of its own.
  const parentOptions = useMemo(() => {
    const below = category ? withDescendants(categories, category.id) : new Set<string>();
    return toCategorySelectOptions(
      categories.filter((candidate) => !below.has(candidate.id)),
      { onlyActive: true, keepId: category?.parentId ?? undefined },
    );
  }, [categories, category]);

  const onError = (error: unknown) => {
    const code = getApiErrorCode(error);
    if (code === 'CATEGORY_NAME_TAKEN') {
      setError('name', { message: productsErrorMessage(error, '') }, { shouldFocus: true });
    } else if (code && PARENT_ERRORS.includes(code)) {
      setError('parentId', { message: productsErrorMessage(error, '') });
    }
  };

  const submit = handleSubmit((values) => {
    const name = values.name.trim();
    const parent = values.parentId || null;
    // Names are unique among the families under the same parent, whatever the case.
    const taken = categories.some(
      (other) =>
        other.id !== category?.id &&
        other.parentId === parent &&
        normalized(other.name) === normalized(name),
    );
    if (taken) {
      setError(
        'name',
        {
          message: parent
            ? 'Ya hay una subfamilia con ese nombre en esa familia.'
            : 'Ya hay una familia principal con ese nombre.',
        },
        { shouldFocus: true },
      );
      return;
    }
    const description = values.description.trim() || null;

    if (!category) {
      create.mutate({ name, parentId: parent, description }, { onSuccess: onSaved, onError });
      return;
    }
    const changes: UpdateCategoryInput = {};
    if (name !== category.name) changes.name = name;
    if (parent !== category.parentId) changes.parentId = parent;
    if (description !== category.description) changes.description = description;
    update.mutate({ id: category.id, input: changes }, { onSuccess: onSaved, onError });
  });

  const code = getApiErrorCode(mutation.error);
  const fieldError = code === 'CATEGORY_NAME_TAKEN' || (!!code && PARENT_ERRORS.includes(code));

  return (
    <Modal
      title={isEdit ? 'Editar familia' : 'Nueva familia'}
      description={
        isEdit
          ? category.name
          : 'Agrupa productos parecidos para buscarlos y filtrarlos. Puede ir dentro de otra familia.'
      }
      size="sm"
      onClose={onClose}
      dismissible={!mutation.isPending}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            size="sm"
            isLoading={mutation.isPending}
            disabled={isEdit && !isDirty}
          >
            {isEdit ? 'Guardar cambios' : 'Crear familia'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={submit} noValidate className="space-y-5">
        {mutation.isError && !fieldError && (
          <Alert tone="danger">
            {productsErrorMessage(mutation.error, 'No se pudo guardar la familia.')}
          </Alert>
        )}
        <TextBox
          label="Nombre"
          required
          maxLength={80}
          placeholder="Ej. Tornillería"
          hint="Único dentro de la familia que la contiene."
          error={errors.name?.message}
          {...register('name')}
        />
        <FormSelect
          control={control}
          name="parentId"
          label="Dentro de"
          optional
          clearable
          searchable
          searchPlaceholder="Buscar familia…"
          emptyMessage="Ninguna familia coincide"
          placeholder="Ninguna: es una familia principal"
          options={parentOptions}
          hint={
            isEdit
              ? 'Al moverla, sus subfamilias y productos se van con ella.'
              : 'Déjalo vacío para crear una familia principal.'
          }
        />
        <TextArea
          label="Descripción"
          optional
          rows={2}
          maxLength={2000}
          placeholder="Ej. Tornillos, tuercas y arandelas de todas las medidas."
          error={errors.description?.message}
          {...register('description')}
        />
      </form>
    </Modal>
  );
}

/** "Nueva familia" (at the top or under one) and "Editar familia" (rename, move, describe). */
export function CategoryFormModal({
  isOpen,
  category,
  ...props
}: Omit<CategoryFormProps, 'category'> & { isOpen: boolean; category?: ProductCategory | null }) {
  if (!isOpen) return null;
  return (
    <CategoryForm
      key={category?.id ?? `new-${props.parentId ?? ''}`}
      category={category ?? undefined}
      {...props}
    />
  );
}
