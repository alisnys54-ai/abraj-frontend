'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RequireAuth } from '@/components/layout/require-auth';
import { useCompanySettings } from '@/hooks/use-resources';
import { usePermission } from '@/hooks/use-permission';
import { useLocale } from '@/lib/i18n/locale-context';
import { api, apiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/states';

export default function SettingsPage() {
  const { t } = useLocale();
  const { data, isLoading } = useCompanySettings();
  const { isSystemOwner } = usePermission();
  const { push } = useToast();
  const qc = useQueryClient();
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');

  const save = async () => {
    if (!key.trim()) return;
    try {
      await api.patch('/settings/company', { key, value });
      qc.invalidateQueries({ queryKey: ['settings'] });
      setKey(''); setValue(''); push(t('settings.settingSaved'));
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  if (!isSystemOwner) {
    return <RequireAuth><EmptyState title={t('settings.systemOwnerOnly')} subtitle={t('settings.systemOwnerOnlyDesc')} /></RequireAuth>;
  }

  return (
    <RequireAuth>
      <div className="max-w-lg">
        <h1 className="text-xl font-medium mb-5">{t('settings.title')}</h1>
        {!isLoading && (
          <Card className="mb-4"><CardContent>
            {Object.keys(data ?? {}).length === 0 && <p className="text-xs text-muted-foreground">{t('settings.noSettingsYet')}</p>}
            {Object.entries(data ?? {}).map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm py-1.5 border-t border-input first:border-t-0 gap-2">
                <span className="font-medium">{k}</span><span className="text-muted-foreground truncate">{JSON.stringify(v)}</span>
              </div>
            ))}
          </CardContent></Card>
        )}
        <Card><CardContent>
          <div className="text-xs font-medium mb-3">{t('settings.addUpdateSetting')}</div>
          <div className="flex flex-col gap-3">
            <div><Label>{t('settings.keyLabel')}</Label><Input value={key} onChange={(e) => setKey(e.target.value)} placeholder={t('settings.keyPlaceholder')} /></div>
            <div><Label>{t('settings.valueLabel')}</Label><Input value={value} onChange={(e) => setValue(e.target.value)} /></div>
            <Button onClick={save} className="self-start">{t('common.save')}</Button>
          </div>
        </CardContent></Card>
      </div>
    </RequireAuth>
  );
}
