'use client';
import { useState } from 'react';
import { RequireAuth } from '@/components/layout/require-auth';
import { useAuth } from '@/hooks/use-auth';
import { useLocale } from '@/lib/i18n/locale-context';
import { api, apiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, type ChangePasswordInput } from '@/lib/schemas/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export default function ProfilePage() {
  const { t } = useLocale();
  const { user, refetchMe } = useAuth();
  const { push } = useToast();
  const [prefs, setPrefs] = useState<Record<string, boolean>>((user?.notification_prefs as any) ?? {});
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  const savePrefs = async (next: Record<string, boolean>) => {
    setPrefs(next);
    try { await api.patch('/me', { notification_prefs: next }); await refetchMe(); } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  const onChangePassword = async (values: ChangePasswordInput) => {
    try {
      await api.post('/auth/change-password', { current_password: values.current_password, new_password: values.new_password });
      reset(); push(t('profile.passwordUpdated'));
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  if (!user) return null;

  return (
    <RequireAuth>
      <div className="max-w-lg flex flex-col gap-4">
        <h1 className="text-xl font-medium">{t('profile.title')}</h1>
        <Card><CardContent>
          <div className="flex items-center gap-3 mb-4">
            <Avatar name={user.full_name} size={48} />
            <div>
              <div className="text-sm font-medium">{user.full_name}</div>
              <div className="text-xs text-muted-foreground">{user.role?.name} · {user.department?.name}</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">{t('common.email')}: {user.email}</div>
          <div className="text-xs text-muted-foreground">{t('common.phone')}: {user.phone ?? '—'}</div>
          <div className="text-xs text-muted-foreground">{t('common.position')}: {user.position?.title ?? '—'}</div>
        </CardContent></Card>

        <Card><CardContent>
          <div className="text-xs font-medium mb-3">{t('profile.notificationPrefs')}</div>
          {['email', 'inapp', 'due', 'mentions', 'system'].map((k) => (
            <label key={k} className="flex items-center gap-2 py-1.5 text-sm capitalize">
              <Checkbox checked={!!prefs[k]} onCheckedChange={(v) => savePrefs({ ...prefs, [k]: !!v })} />
              {k}
            </label>
          ))}
        </CardContent></Card>

        <Card><CardContent>
          <div className="text-xs font-medium mb-3">{t('profile.changePassword')}</div>
          <form onSubmit={handleSubmit(onChangePassword)} className="flex flex-col gap-3">
            <div><Label>{t('profile.currentPassword')}</Label><Input type="password" {...register('current_password')} /></div>
            <div><Label>{t('profile.newPassword')}</Label><Input type="password" {...register('new_password')} /></div>
            <div><Label>{t('profile.confirmPassword')}</Label><Input type="password" {...register('confirm_password')} /></div>
            <Button type="submit" disabled={isSubmitting} className="self-start">{t('profile.updatePassword')}</Button>
          </form>
        </CardContent></Card>
      </div>
    </RequireAuth>
  );
}
