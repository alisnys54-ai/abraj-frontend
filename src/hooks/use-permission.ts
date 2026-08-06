'use client';
import { useAuth } from './use-auth';

/** Mirrors the backend's PermissionsGuard exactly: System Owner always passes; otherwise looks up the (module, action) grant fetched at login via GET /me and returns its scope, or null if not granted. UI-side gating only — the API re-checks every request server-side regardless. */
export function usePermission() {
  const { user } = useAuth();

  const scopeFor = (module: string, action: string): 'all' | 'department' | 'own' | null => {
    if (!user) return null;
    if (user.is_system_owner) return 'all';
    const grant = user.permissions.find((p) => p.module === module && p.action === action);
    return grant?.scope ?? null;
  };

  const can = (module: string, action: string) => scopeFor(module, action) !== null;

  return { can, scopeFor, isSystemOwner: !!user?.is_system_owner, roleName: user?.role?.name ?? null };
}
