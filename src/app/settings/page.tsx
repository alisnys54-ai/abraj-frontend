'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RequireAuth } from '@/components/layout/require-auth';
import { useCompanySettings } from '@/hooks/use-resources';
import { usePermission } from '@/hooks/use-permission';
import { api, apiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/states';

export default function SettingsPage() {
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
      setKey(''); setValue(''); push('Setting saved');
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  if (!isSystemOwner) {
    return <RequireAuth><EmptyState title="System Owner only" subtitle="Company settings can only be changed by the System Owner." /></RequireAuth>;
  }

  return (
    <RequireAuth>
      <div className="max-w-lg">
        <h1 className="text-xl font-medium mb-5">Company Settings</h1>
        {!isLoading && (
          <Card className="mb-4"><CardContent>
            {Object.keys(data ?? {}).length === 0 && <p className="text-xs text-muted-foreground">No settings configured yet.</p>}
            {Object.entries(data ?? {}).map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm py-1.5 border-t border-input first:border-t-0">
                <span className="font-medium">{k}</span><span className="text-muted-foreground">{JSON.stringify(v)}</span>
              </div>
            ))}
          </CardContent></Card>
        )}
        <Card><CardContent>
          <div className="text-xs font-medium mb-3">Add / Update Setting</div>
          <div className="flex flex-col gap-3">
            <div><Label>Key</Label><Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="e.g. company_name" /></div>
            <div><Label>Value</Label><Input value={value} onChange={(e) => setValue(e.target.value)} /></div>
            <Button onClick={save} className="self-start">Save</Button>
          </div>
        </CardContent></Card>
      </div>
    </RequireAuth>
  );
}
