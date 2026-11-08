import type { NavSection } from '@/shared/layout/nav';

interface MenuPreviewProps {
  roleName: string;
  sections: NavSection[];
}

/** The menu a person holding the role would see, updated as the switches change. */
export function MenuPreview({ roleName, sections }: MenuPreviewProps) {
  return (
    <aside
      aria-label="Vista previa del menú"
      className="flex flex-col gap-0.5 rounded-2xl bg-fg p-5 text-canvas lg:sticky lg:top-4 lg:self-start"
    >
      <p className="mb-1 text-xs font-semibold tracking-widest text-canvas/60">VER MENÚ COMO</p>
      <p className="mb-2 text-xl font-bold">{roleName}</p>

      {sections.length === 0 && (
        <p className="py-2 text-sm text-canvas/60">Este rol todavía no ve ninguna pantalla.</p>
      )}

      {sections.map((section) => (
        <div key={section.id}>
          <p className="px-1 pt-3 pb-1 text-[11px] font-semibold tracking-widest text-canvas/60 uppercase">
            {section.label}
          </p>
          <ul>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to} className="flex min-h-9 items-center gap-2 px-2 text-sm">
                  {Icon && <Icon aria-hidden className="size-4 shrink-0" />}
                  {item.label}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </aside>
  );
}
