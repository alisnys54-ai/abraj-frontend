'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/schemas/auth';
import { useAuth, apiErrorMessage } from '@/hooks/use-auth';
import { useLocale } from '@/lib/i18n/locale-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    try {
      const { forcePasswordChange } = await login(values.email, values.password);
      router.push(forcePasswordChange ? '/change-password' : '/dashboard');
    } catch (e) {
      setServerError(apiErrorMessage(e));
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4 sm:p-8 relative">
      <button
        className="absolute top-4 end-4 flex items-center gap-1 text-xs font-medium text-white/70 hover:text-white"
        onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
      >
        <Languages className="h-3.5 w-3.5" />
        {locale === 'ar' ? 'English' : 'العربية'}
      </button>
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-7">
          <img src="/logo.png" alt="Abraj Al Yasir Contracting Company" className="mx-auto mb-3 h-24 w-auto" />
          <div className="text-white/50 text-xs mt-1">{t('auth.taskManagement')}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-2xl">
          <div className="text-base font-medium mb-5">{t('auth.signIn')}</div>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
              <Label>{t('common.email')}</Label>
              <Input type="email" placeholder={t('auth.emailPlaceholder')} {...register('email')} />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label>{t('auth.password')}</Label>
              <Input type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
            </div>
            {serverError && <p className="text-xs text-destructive">{serverError}</p>}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
