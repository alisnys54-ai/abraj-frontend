'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { AppShell } from './app-shell';

/** Client-side route guard — chosen over Next.js middleware because tokens live in localStorage (not cookies), which the edge runtime middleware can't read. Redirects to /login when unauthenticated, and to /change-password when a first-login password change is still pending. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }
    if (user.must_change_password && pathname !== '/change-password') router.replace('/change-password');
  }, [loading, user, pathname, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Skeleton className="h-8 w-40" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
