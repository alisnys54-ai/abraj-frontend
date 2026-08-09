'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RequireAuth } from '@/components/layout/require-auth';
import { usePositions, useDepartments } from '@/hooks/use-resources';
import { usePermission } from '@/hooks/use-permission';
import { useLocale } from '@/lib/i18n/locale-context';
import { api, apiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { createPositionSchema, type CreatePositionInput } from '@/lib/schemas/position';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/states';

export default function PositionsPage() {
  const { t } = useLocale();
  const { data, isLoading } = usePositions({ page: 1, page_size: 100, include_archived: true });
  const { data: depts } = useDepartments({ page: 1, page_size: 100 });
  const { can } = usePermission();
  const { push } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<CreatePositionInput>({ resolver: zodResolver(createPositionSchema) });

  const deptName = (id: string | null) => depts?.data.find((d) => d.id === id)?.name ?? '—';

  const onCreate = async (values: CreatePositionInput) => {
    try {
      await api.post('/positions', { title: values.title, department_id: values.department_id || undefined });
      qc.invalidateQueries({ queryKey: ['positions'] });
      setOpen(false); reset(); push(t('positions.created'));
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  const toggleArchive = async (id: string, archived: boolean) => {
    try {
      await api.patch(`/positions/${id}/${archived ? 'restore' : 'archive'}`);
      qc.invalidateQueries({ queryKey: ['positions'] });
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  return (
    <RequireAuth>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-5 gap-2">
          <h1 className="text-xl font-medium">{t('positions.title')}</h1>
          {can('positions', 'create') && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button>{t('positions.newPosition')}</Button></DialogTrigger>
              <DialogContent title={t('positions.createPosition')}>
                <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-3">
                  <div><Label>{t('common.title')}</Label><Input {...register('title')} /></div>
                  <div>
                    <Label>{t('common.department')} ({t('common.optional')})</Label>
                    <Select {...register('department_id')}>
                      <option value="">{t('positions.companyWide')}</option>
                      {depts?.data.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <Button type="button" variant="secondary" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
                    <Button type="submit" disabled={isSubmitting}>{t('common.create')}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        {isLoading && <Skeleton className="h-40" />}
        {data && data.data.length === 0 && <EmptyState title={t('positions.noPositionsYet')} />}
        {data && data.data.length > 0 && (
          <div className="rounded-lg border border-input bg-white overflow-hidden">
            {data.data.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3 border-t first:border-t-0 border-input text-sm">
                <span className={`flex-1 min-w-[120px] ${p.is_archived ? 'text-muted-foreground line-through' : ''}`}>{p.title}</span>
                <span className="text-[11px] text-muted-foreground">{deptName(p.department_id)}</span>
                {can('positions', 'edit') && (
                  <button onClick={() => toggleArchive(p.id, p.is_archived)} className={`text-[11px] ${p.is_archived ? 'text-accent' : 'text-destructive'}`}>
                    {p.is_archived ? t('positions.restore') : t('positions.archive')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
