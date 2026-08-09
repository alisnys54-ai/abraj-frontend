'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? '/dashboard' : '/login');
  }, [loading, user, router]);

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
    </div>
  );
}
