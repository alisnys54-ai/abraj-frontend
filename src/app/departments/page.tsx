'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RequireAuth } from '@/components/layout/require-auth';
import { useDepartmentTree } from '@/hooks/use-resources';
import { usePermission } from '@/hooks/use-permission';
import { useLocale } from '@/lib/i18n/locale-context';
import { api, apiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { createDepartmentSchema, type CreateDepartmentInput, type DepartmentNode } from '@/lib/schemas/department';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/states';
import { useConfirmDialog } from '@/components/shared/confirm-dialog';

function DeptNode({ node, depth, onArchive, onRestore, canManage }: { node: DepartmentNode; depth: number; onArchive: (id: string) => void; onRestore: (id: string) => void; canManage: boolean }) {
  const { t } = useLocale();
  return (
    <div style={{ marginInlineStart: depth * 20 }} className="mb-1.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-md border border-input bg-white px-3 py-2">
        <span className={`text-sm font-medium flex-1 min-w-[120px] ${!node.is_active ? 'text-muted-foreground line-through' : ''}`}>{node.name}</span>
        <span className="text-[11px] text-muted-foreground">{node.employee_count} {t('common.employees')} · {node.position_count} {t('departments.positions')}</span>
        {node.managers.length > 0 && <span className="text-[11px] text-accent">{node.managers.map((m) => m.full_name).join(', ')}</span>}
        {canManage && (node.is_active ? <button onClick={() => onArchive(node.id)} className="text-[11px] text-destructive">{t('common.archive')}</button> : <button onClick={() => onRestore(node.id)} className="text-[11px] text-accent">{t('common.restore')}</button>)}
      </div>
      {node.children.map((c) => <DeptNode key={c.id} node={c} depth={depth + 1} onArchive={onArchive} onRestore={onRestore} canManage={canManage} />)}
    </div>
  );
}

export default function DepartmentsPage() {
  const { t } = useLocale();
  const { data: tree, isLoading } = useDepartmentTree();
  const { can } = usePermission();
  const { push } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<CreateDepartmentInput>({ resolver: zodResolver(createDepartmentSchema) });
  const { confirm, dialog } = useConfirmDialog();
  const canManage = can('departments', 'manage') || can('departments', 'edit');

  const onCreate = async (values: CreateDepartmentInput) => {
    try {
      await api.post('/departments', { name: values.name, parent_department_id: values.parent_department_id || undefined });
      qc.invalidateQueries({ queryKey: ['departments-tree'] });
      setOpen(false); reset(); push(t('departments.created'));
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  const archive = (id: string) => confirm(t('departments.archiveTitle'), t('departments.archiveDesc'), async () => {
    try { await api.patch(`/departments/${id}/archive`); qc.invalidateQueries({ queryKey: ['departments-tree'] }); } catch (e) { push(apiErrorMessage(e), 'error'); }
  });
  const restore = async (id: string) => {
    try { await api.patch(`/departments/${id}/restore`); qc.invalidateQueries({ queryKey: ['departments-tree'] }); } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  return (
    <RequireAuth>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-5 gap-2">
          <h1 className="text-xl font-medium">{t('departments.title')}</h1>
          {can('departments', 'create') && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button>{t('departments.newDepartment')}</Button></DialogTrigger>
              <DialogContent title={t('departments.createDepartment')}>
                <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-3">
                  <div><Label>{t('common.name')}</Label><Input {...register('name')} /></div>
                  <div className="flex justify-end gap-2 mt-2">
                    <Button type="button" variant="secondary" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
                    <Button type="submit" disabled={isSubmitting}>{t('common.create')}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        {isLoading && <Skeleton className="h-64" />}
        {tree && tree.length === 0 && <EmptyState title={t('departments.noDepartmentsYet')} />}
        {tree?.map((n) => <DeptNode key={n.id} node={n} depth={0} onArchive={archive} onRestore={restore} canManage={canManage} />)}
        {dialog}
      </div>
    </RequireAuth>
  );
}
