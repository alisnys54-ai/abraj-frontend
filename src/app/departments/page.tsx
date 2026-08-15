'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RequireAuth } from '@/components/layout/require-auth';
import { useDepartmentTree, useUsers } from '@/hooks/use-resources';
import { usePermission } from '@/hooks/use-permission';
import { useLocale } from '@/lib/i18n/locale-context';
import { api, apiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { createDepartmentSchema, type CreateDepartmentInput, type DepartmentNode } from '@/lib/schemas/department';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/states';
import { useConfirmDialog } from '@/components/shared/confirm-dialog';

function DeptNode({ node, depth, onArchive, onRestore, onEdit, onDelete, onManagers, canEdit, canDelete, canManageMgrs }: {
  node: DepartmentNode; depth: number;
  onArchive: (id: string) => void; onRestore: (id: string) => void;
  onEdit: (n: DepartmentNode) => void; onDelete: (n: DepartmentNode) => void; onManagers: (n: DepartmentNode) => void;
  canEdit: boolean; canDelete: boolean; canManageMgrs: boolean;
}) {
  const { t } = useLocale();
  return (
    <div style={{ marginInlineStart: depth * 20 }} className="mb-1.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-md border border-input bg-white px-3 py-2">
        <span className={`text-sm font-medium flex-1 min-w-[120px] ${!node.is_active ? 'text-muted-foreground line-through' : ''}`}>{node.name}</span>
        <span className="text-[11px] text-muted-foreground">{node.employee_count} {t('common.employees')} · {node.position_count} {t('departments.positions')}</span>
        {node.managers.length > 0 && <span className="text-[11px] text-accent">{node.managers.map((m) => m.full_name).join(', ')}</span>}
        <div className="flex items-center gap-3">
          {canEdit && <button onClick={() => onEdit(node)} className="text-[11px] text-accent">{t('departments.edit')}</button>}
          {canManageMgrs && <button onClick={() => onManagers(node)} className="text-[11px] text-accent">{t('departments.managers')}</button>}
          {canEdit && (node.is_active
            ? <button onClick={() => onArchive(node.id)} className="text-[11px] text-destructive">{t('common.archive')}</button>
            : <button onClick={() => onRestore(node.id)} className="text-[11px] text-accent">{t('common.restore')}</button>)}
          {canDelete && <button onClick={() => onDelete(node)} className="text-[11px] text-destructive font-medium">{t('departments.deleteDept')}</button>}
        </div>
      </div>
      {node.children.map((c) => <DeptNode key={c.id} node={c} depth={depth + 1} onArchive={onArchive} onRestore={onRestore} onEdit={onEdit} onDelete={onDelete} onManagers={onManagers} canEdit={canEdit} canDelete={canDelete} canManageMgrs={canManageMgrs} />)}
    </div>
  );
}

export default function DepartmentsPage() {
  const { t } = useLocale();
  const { data: tree, isLoading } = useDepartmentTree();
  const { data: users } = useUsers({ page: 1, page_size: 200 });
  const { can, isSystemOwner } = usePermission();
  const { push } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editNode, setEditNode] = useState<DepartmentNode | null>(null);
  const [editName, setEditName] = useState('');
  const [mgrNode, setMgrNode] = useState<DepartmentNode | null>(null);
  const [newMgr, setNewMgr] = useState('');
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<CreateDepartmentInput>({ resolver: zodResolver(createDepartmentSchema) });
  const { confirm, dialog } = useConfirmDialog();

  const canEdit = can('departments', 'manage') || can('departments', 'edit');
  const canDelete = can('departments', 'delete') || isSystemOwner;
  const refresh = () => qc.invalidateQueries({ queryKey: ['departments-tree'] });

  const onCreate = async (values: CreateDepartmentInput) => {
    try {
      await api.post('/departments', { name: values.name, parent_department_id: values.parent_department_id || undefined });
      refresh(); setOpen(false); reset(); push(t('departments.created'));
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  const openEdit = (n: DepartmentNode) => { setEditNode(n); setEditName(n.name); };
  const saveEdit = async () => {
    if (!editNode) return;
    try {
      await api.patch(`/departments/${editNode.id}`, { name: editName });
      refresh(); setEditNode(null); push(t('departments.updated'));
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  const onDelete = (n: DepartmentNode) => confirm(t('departments.deleteDept'), t('departments.deleteConfirm', { name: n.name }), async () => {
    try { await api.delete(`/departments/${n.id}`); refresh(); push(t('departments.deleted')); } catch (e) { push(apiErrorMessage(e), 'error'); }
  });

  const archive = (id: string) => confirm(t('departments.archiveTitle'), t('departments.archiveDesc'), async () => {
    try { await api.patch(`/departments/${id}/archive`); refresh(); } catch (e) { push(apiErrorMessage(e), 'error'); }
  });
  const restore = async (id: string) => {
    try { await api.patch(`/departments/${id}/restore`); refresh(); } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  const addManager = async () => {
    if (!mgrNode || !newMgr) return;
    try {
      await api.post(`/departments/${mgrNode.id}/managers`, { user_id: newMgr });
      refresh(); setNewMgr(''); push(t('departments.managerAdded'));
      // reflect immediately in the open dialog
      const picked = users?.data.find((u) => u.id === newMgr);
      const fresh = { ...mgrNode, managers: [...mgrNode.managers, picked ? { user_id: picked.id, full_name: picked.full_name } : null].filter(Boolean) as any };
      setMgrNode(fresh);
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };
  const removeManager = async (userId: string) => {
    if (!mgrNode) return;
    try {
      await api.delete(`/departments/${mgrNode.id}/managers/${userId}`);
      refresh(); push(t('departments.managerRemoved'));
      setMgrNode({ ...mgrNode, managers: mgrNode.managers.filter((m) => m.user_id !== userId) });
    } catch (e) { push(apiErrorMessage(e), 'error'); }
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
        {tree?.map((n) => (
          <DeptNode key={n.id} node={n} depth={0}
            onArchive={archive} onRestore={restore} onEdit={openEdit} onDelete={onDelete} onManagers={setMgrNode}
            canEdit={canEdit} canDelete={canDelete} canManageMgrs={canEdit} />
        ))}
        {dialog}

        {/* Edit department name */}
        <Dialog open={!!editNode} onOpenChange={(o) => !o && setEditNode(null)}>
          <DialogContent title={t('departments.editDepartment')}>
            <div className="flex flex-col gap-3">
              <div><Label>{t('common.name')}</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="secondary" onClick={() => setEditNode(null)}>{t('common.cancel')}</Button>
                <Button onClick={saveEdit}>{t('departments.save')}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Manage managers */}
        <Dialog open={!!mgrNode} onOpenChange={(o) => !o && setMgrNode(null)}>
          <DialogContent title={`${t('departments.manageManagers')} — ${mgrNode?.name ?? ''}`}>
            <div className="flex flex-col gap-3">
              {mgrNode && mgrNode.managers.length === 0 && <p className="text-xs text-muted-foreground">{t('departments.noManagers')}</p>}
              {mgrNode?.managers.map((m) => (
                <div key={m.user_id} className="flex items-center justify-between text-sm border-b border-input pb-2">
                  <span>{m.full_name}</span>
                  <button onClick={() => removeManager(m.user_id)} className="text-[11px] text-destructive">{t('common.delete')}</button>
                </div>
              ))}
              <div className="flex gap-2 items-end mt-1">
                <div className="flex-1">
                  <Label>{t('departments.assignManager')}</Label>
                  <Select value={newMgr} onChange={(e) => setNewMgr(e.target.value)}>
                    <option value="">{t('common.selectPlaceholder')}</option>
                    {users?.data.filter((u) => !mgrNode?.managers.some((m) => m.user_id === u.id)).map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                  </Select>
                </div>
                <Button onClick={addManager}>{t('departments.addManager')}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RequireAuth>
  );
}
