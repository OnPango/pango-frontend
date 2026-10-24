import { DataTable } from '@/shared/ui/components/DataTable';
import { DashboardContent } from '../content/content';

type ProductRow = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
};

export default function DashboardPage() {
  const rows: ProductRow[] = [];

  return (
    <>
      <div className="flex flex-col gap-10">
        <section className="flex flex-col gap-3">
          <h2 className="text-3xl font-bold lg:text-4xl">{DashboardContent.greeting}</h2>
          <p className="font-light">{DashboardContent.message}</p>
        </section>

        <section>
          <DataTable<ProductRow>
            columns={[
              {
                key: 'name',
                header: 'Producto',
                cell: (row: ProductRow) => row.name,
              },
              {
                key: 'quantity',
                header: 'Cantidad',
                cell: (row: ProductRow) => row.quantity,
              },
              {
                key: 'unit',
                header: 'Unidad',
                cell: (row: ProductRow) => row.unit,
              },
              {
                key: 'actions',
                header: 'Acciones',
                cell: (row: ProductRow) => (
                  <button type="button" onClick={() => alert(row.name)}>
                    Eliminar
                  </button>
                ),
              },
            ]}
            rows={rows}
            getRowKey={(row: ProductRow) => row.id}
            caption="Tabla de productos"
            emptyMessage="No hay productos para mostrar."
          />
        </section>
      </div>
    </>
  );
}
