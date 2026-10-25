export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4 space-y-2">
      <h1 className="text-4xl font-bold">{title}</h1>
      {subtitle && <p className="text-md text-muted">{subtitle}</p>}
    </div>
  );
}
