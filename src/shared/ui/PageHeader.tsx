import type { IconType } from "react-icons";
import { Button } from "./components/Button";

export function PageHeader({ title, subtitle, onAction, icon, actionText }: { title: string; subtitle?: string, onAction?: () => void, icon?: IconType, actionText?: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-primary/5 p-8">
      <h2 className="text-3xl font-bold lg:text-4xl">{title}</h2>
      {subtitle && <p className="text-lg font-light">{subtitle}</p>}
      {onAction && 
        <Button
          type="button"
          variant="primary"
          onClick={onAction}
          className="flex items-center gap-2 self-start rounded-2xl py-3"
        >
          {icon && null}
          <span>{actionText || "Nuevo"}</span>
        </Button>
      }
    </div>
  );
}
