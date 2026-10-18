import type { User, Permission } from "@/shared/types/user";

export function hasAnyPermission(user: User | null, anyOf: Permission[]): boolean {
    return !!user && anyOf.some((p) => user.permissions.includes(p));
}
