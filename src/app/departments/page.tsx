'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RequireAuth } from '@/components/layout/require-auth';
import { useDepartmentTree } from '@/hooks/use-resources';
import { usePermission } from '@/hooks/use-permission';
import { api, apiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { createDepartmentSchema, type CreateDepartmentInput, type DepartmentNode } from '@/lib/schemas/department';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/states';
import { useConfirmDialog } from '@/components/shared/confirm-dialog';

function DeptNode({ node, depth, onArchive, onRestore, canManage }: { node: DepartmentNode; depth: number; onArchive: (id: string) => void; onRestore: (id: string) => void; canManage: boolean }) {
  return (
    <div style={{ marginInlineStart: depth * 20 }} className="mb-1.5">
      <div className="flex items-center gap-3 rounded-md border border-input bg-white px-3 py-2">
        <span className={`text-sm font-medium flex-1 ${!node.is_active ? 'text-muted-foreground line-through' : ''}`}>{node.name}</span>
        <span className="text-[11px] text-muted-foreground">{node.employee_count} employees · {node.position_count} positions</span>
        {node.managers.length > 0 && <span className="text-[11px] text-accent">{node.managers.map((m) => m.full_name).join(', ')}</span>}
        {canManage && (node.is_active ? <button onClick={() => onArchive(node.id)} className="text-[11px] text-destructive">Archive</button> : <button onClick={() => onRestore(node.id)} className="text-[11px] text-accent">Restore</button>)}
      </div>
      {node.children.map((c) => <DeptNode key={c.id} node={c} depth={depth + 1} onArchive={onArchive} onRestore={onRestore} canManage={canManage} />)}
    </div>
  );
}

export default function DepartmentsPage() {
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
      setOpen(false); reset(); push('Department created');
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  const archive = (id: string) => confirm('Archive department', 'This department will be hidden from active views.', async () => {
    try { await api.patch(`/departments/${id}/archive`); qc.invalidateQueries({ queryKey: ['departments-tree'] }); } catch (e) { push(apiErrorMessage(e), 'error'); }
  });
  const restore = async (id: string) => {
    try { await api.patch(`/departments/${id}/restore`); qc.invalidateQueries({ queryKey: ['departments-tree'] }); } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  return (
    <RequireAuth>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-medium">Departments</h1>
          {can('departments', 'create') && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button>New Department</Button></DialogTrigger>
              <DialogContent title="Create Department">
                <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-3">
                  <div><Label>Name</Label><Input {...register('name')} /></div>
                  <div className="flex justify-end gap-2 mt-2">
                    <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>Create</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        {isLoading && <Skeleton className="h-64" />}
        {tree && tree.length === 0 && <EmptyState title="No departments yet" />}
        {tree?.map((n) => <DeptNode key={n.id} node={n} depth={0} onArchive={archive} onRestore={restore} canManage={canManage} />)}
        {dialog}
      </div>
    </RequireAuth>
  );
}
