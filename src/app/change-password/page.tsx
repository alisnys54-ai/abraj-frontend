'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, type ChangePasswordInput } from '@/lib/schemas/auth';
import { api, apiErrorMessage } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { useLocale } from '@/lib/i18n/locale-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function ChangePasswordPage() {
  const { t, locale } = useLocale();
  const { user, refetchMe } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = async (values: ChangePasswordInput) => {
    setServerError(null);
    try {
      await api.post('/auth/change-password', { current_password: values.current_password, new_password: values.new_password });
      await refetchMe();
      router.push('/dashboard');
    } catch (e) {
      setServerError(apiErrorMessage(e));
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-[420px] bg-white rounded-2xl p-5 sm:p-7 shadow-2xl">
        <div className="text-base font-medium mb-1">{t('changePassword.setNewPassword')}</div>
        <p className="text-xs text-muted-foreground mb-5">
          {locale === 'ar' ? `مرحباً ${user?.full_name} — ` : `Hi ${user?.full_name} — `}
          {t('changePassword.firstLoginDesc')}
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <Label>{t('changePassword.currentTempPassword')}</Label>
            <Input type="password" {...register('current_password')} />
          </div>
          <div>
            <Label>{t('profile.newPassword')}</Label>
            <Input type="password" {...register('new_password')} />
            {errors.new_password && <p className="text-xs text-destructive mt-1">{errors.new_password.message}</p>}
          </div>
          <div>
            <Label>{t('profile.confirmPassword')}</Label>
            <Input type="password" {...register('confirm_password')} />
            {errors.confirm_password && <p className="text-xs text-destructive mt-1">{errors.confirm_password.message}</p>}
          </div>
          {serverError && <p className="text-xs text-destructive">{serverError}</p>}
          <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? t('common.saving') : t('changePassword.saveContinue')}</Button>
        </form>
      </div>
    </div>
  );
}
