'use client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { AuthProvider } from '@/hooks/use-auth';
import { ToastProvider } from '@/components/ui/toast';
import { LocaleProvider } from '@/lib/i18n/locale-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </LocaleProvider>
  );
}
