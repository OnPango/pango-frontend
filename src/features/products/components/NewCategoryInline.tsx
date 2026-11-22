import { useEffect, useRef, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { Button } from '@/shared/ui/components/Button';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { useCreateCategory } from '../api/products.queries';
import { productsErrorMessage } from '../content/products.errors';
import type { ProductCategory } from '../types/products.types';

/**
 * "Nueva familia" next to the family select: a new organization has no families, and a product
 * cannot be saved without one. Creates a top-level family; nesting and renaming belong to the
 * families screen.
 */
export function NewCategoryInline({
  onCreated,
}: {
  onCreated: (category: ProductCategory) => void;
}) {
  const createCategory = useCreateCategory();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Opening it means the user is about to type the name.
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const close = () => {
    setIsOpen(false);
    setName('');
    setError(null);
    createCategory.reset();
  };

  const create = () => {
    if (!name.trim()) {
      setError('Escribe el nombre de la familia.');
      return;
    }
    setError(null);
    createCategory.mutate(
      { name },
      {
        onSuccess: (category) => {
          onCreated(category);
          close();
        },
        onError: (err) => setError(productsErrorMessage(err, 'No se pudo crear la familia.')),
      },
    );
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1 self-start px-2 text-primary"
      >
        <FiPlus aria-hidden className="size-4" /> Nueva familia
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line2 bg-canvas p-3">
      <TextBox
        label="Nombre de la nueva familia"
        hint="Se crea como familia principal y queda elegida para este producto."
        placeholder="Ej. Ferretería"
        value={name}
        maxLength={80}
        ref={inputRef}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          // Enter would submit the product form around it.
          if (e.key === 'Enter') {
            e.preventDefault();
            create();
          }
        }}
        error={error ?? undefined}
        size="sm"
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={close} disabled={createCategory.isPending}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={create} isLoading={createCategory.isPending}>
          Crear familia
        </Button>
      </div>
    </div>
  );
}
