import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { getApiErrorCode } from '@/core/api/errors';
import { useCreateRequest } from '../api/requests.queries';
import { errorLine, requestsErrorMessage } from '../content/requests.errors';
import type { RequestPriority, StockRequest } from '../types/requests.types';
import {
  EMPTY_REQUEST_FORM,
  requestSchema,
  toQuantity,
  type RequestFormValues,
} from '../types/request.schema';

/** Line errors shown on the line's product field. */
const LINE_ERRORS = new Set(['PRODUCT_INVALID', 'PRODUCT_DUPLICATED']);

/** State and rules of "Nueva solicitud" (US-028): header, lines, request and field errors. */
export function useRequestForm({
  initialWarehouseId,
  onCreated,
}: {
  initialWarehouseId: string | null;
  onCreated: (request: StockRequest) => void;
}) {
  const create = useCreateRequest();
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    mode: 'onTouched',
    defaultValues: { ...EMPTY_REQUEST_FORM, warehouseId: initialWarehouseId ?? '' },
  });
  const lines = useFieldArray({ control: form.control, name: 'lines' });

  const submit = form.handleSubmit((values) => {
    create.mutate(
      {
        type: values.type,
        warehouseId: values.warehouseId,
        priority: Number(values.priority) as RequestPriority,
        requiredDate: values.requiredDate || null,
        notes: values.notes || null,
        lines: values.lines.map((line) => ({
          productId: line.productId,
          quantity: toQuantity(line.quantity),
        })),
      },
      {
        onSuccess: onCreated,
        onError: (error) => {
          const code = getApiErrorCode(error);
          const line = errorLine(error);
          if (code && LINE_ERRORS.has(code) && line && line <= values.lines.length) {
            form.setError(`lines.${line - 1}.productId`, {
              message: requestsErrorMessage(error, ''),
            });
          } else if (code === 'WAREHOUSE_INVALID') {
            form.setError('warehouseId', { message: requestsErrorMessage(error, '') });
          }
        },
      },
    );
  });

  const code = getApiErrorCode(create.error);
  const onField =
    (code && LINE_ERRORS.has(code) && errorLine(create.error) !== null) ||
    code === 'WAREHOUSE_INVALID';

  return {
    form,
    lines,
    submit,
    isSubmitting: create.isPending,
    /** Errors not about one field (no area, permissions, network…). */
    serverError:
      create.isError && !onField
        ? requestsErrorMessage(create.error, 'No se pudo crear la solicitud.')
        : null,
  };
}
