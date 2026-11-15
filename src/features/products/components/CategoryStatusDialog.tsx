import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { Modal } from '@/shared/ui/components/Modal';
import { useUpdateCategory } from '../api/products.queries';
import { productsErrorMessage } from '../content/products.errors';
import type { ProductCategory } from '../types/products.types';

const list = (names: string[]) =>
  names.length <= 1
    ? (names[0] ?? '')
    : `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;

/**
 * Confirms deactivating or reactivating a family, or says what keeps it from changing: pango-core
 * deactivates a family only once its subfamilies are inactive, and reactivates it only under an
 * active family.
 */
export function CategoryStatusDialog({
  category,
  categories,
  onClose,
  onDone,
}: {
  category: ProductCategory;
  categories: ProductCategory[];
  onClose: () => void;
  onDone: (category: ProductCategory) => void;
}) {
  const update = useUpdateCategory();
  const deactivating = category.isActive;
  const activeChildren = categories
    .filter((child) => child.parentId === category.id && child.isActive)
    .map((child) => `«${child.name}»`)
    .sort((a, b) => a.localeCompare(b, 'es'));
  const parent = categories.find((candidate) => candidate.id === category.parentId);

  const blocker = deactivating
    ? activeChildren.length > 0
      ? `Tiene ${activeChildren.length === 1 ? 'una subfamilia activa' : 'subfamilias activas'}: ${list(activeChildren)}. Desactívala${activeChildren.length === 1 ? '' : 's'} primero.`
      : null
    : parent && !parent.isActive
      ? `Está dentro de «${parent.name}», que está inactiva. Reactiva primero «${parent.name}» o mueve esta familia a otra con «Editar».`
      : null;

  const products =
    category.productCount === 1 ? '1 producto' : `${category.productCount} productos`;

  return (
    <Modal
      title={
        blocker
          ? `Todavía no puedes ${deactivating ? 'desactivar' : 'reactivar'} «${category.name}»`
          : deactivating
            ? `¿Desactivar «${category.name}»?`
            : `¿Reactivar «${category.name}»?`
      }
      size="sm"
      onClose={onClose}
      dismissible={!update.isPending}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={update.isPending}>
            {blocker ? 'Entendido' : 'Cancelar'}
          </Button>
          {!blocker && (
            <Button
              variant={deactivating ? 'danger' : 'primary'}
              size="sm"
              isLoading={update.isPending}
              onClick={() =>
                update.mutate(
                  { id: category.id, input: { isActive: !deactivating } },
                  { onSuccess: onDone },
                )
              }
            >
              {deactivating ? 'Desactivar familia' : 'Reactivar familia'}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-3 text-sm">
        {update.isError && (
          <Alert tone="danger">
            {productsErrorMessage(update.error, 'No se pudo cambiar el estado de la familia.')}
          </Alert>
        )}
        {blocker ? (
          <p>{blocker}</p>
        ) : deactivating ? (
          <>
            <p>Ya no se podrá elegir para productos nuevos ni para crear subfamilias.</p>
            {category.productCount > 0 && (
              <p className="text-fg/90">
                Sus {products} la conservan y se siguen pudiendo buscar y filtrar por ella.
              </p>
            )}
            <p className="text-muted">Puedes reactivarla cuando quieras.</p>
          </>
        ) : (
          <p>Volverá a poder elegirse para productos y subfamilias.</p>
        )}
      </div>
    </Modal>
  );
}
