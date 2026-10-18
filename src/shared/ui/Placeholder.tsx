import { PageHeader } from './PageHeader';

export function Placeholder({ title, refs }: { title: string; refs?: string }) {
  return (
    <>
      <PageHeader title={title} subtitle={refs} />
      <div className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
        Módulo pendiente de implementación.
      </div>
    </>
  );
}
