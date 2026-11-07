import type { User } from '@/core/auth/user';
import { Avatar } from './Avatar';

/** The signed-in user's avatar in the header. The name is not written next to it, so it is announced. */
export function AvatarButton({ user }: { user: User }) {
  return <Avatar name={user?.name ?? ''} size="sm" />;
}
