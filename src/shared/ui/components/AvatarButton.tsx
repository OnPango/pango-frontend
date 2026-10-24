import { getInitials } from '@/shared/lib/initials';
import type { User } from '@/core/auth/user';

export function AvatarButton({ user }: { user: User }) {
  return (
    <span
      aria-hidden
      className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-fg"
    >
      {getInitials(user?.name ?? '')}
    </span>
  );
}
