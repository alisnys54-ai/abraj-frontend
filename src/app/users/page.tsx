'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RequireAuth } from '@/components/layout/require-auth';
import { useUsers, useDepartments, useRoles } from '@/hooks/use-resources';
import { usePermission } from '@/hooks/use-permission';
import { useLocale } from '@/lib/i18n/locale-context';
import { api, apiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { createUserSchema, type CreateUserInput, transferUserSchema, type TransferUserInput } from '@/lib/schemas/user';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, Pagination } from '@/components/shared/states';

export default function UsersPage() {
  const { t } = useLocale();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useUsers({ page, page_size: 20 });
  const { data: depts } = useDepartments({ page: 1, page_size: 100 });
  const { data: roles } = useRoles();
  const { can, isSystemOwner } = usePermission();
  const { push } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [transferId, setTransferId] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [editData, setEditData] = useState({ full_name: '', phone: '', department_id: '' });

  const createForm = useForm<CreateUserInput>({ resolver: zodResolver(createUserSchema) });
  const transferForm = useForm<TransferUserInput>({ resolver: zodResolver(transferUserSchema) });

  const deptName = (id: string) => depts?.data.find((d) => d.id === id)?.name ?? '—';

  const onCreate = async (values: CreateUserInput) => {
    try {
      const res = await api.post('/users', { ...values, position_id: values.position_id || undefined, phone: values.phone || undefined });
      qc.invalidateQueries({ queryKey: ['users'] });
      setOpen(false); createForm.reset();
      setTempPassword(res.data.temporary_password);
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  const onTransfer = async (values: TransferUserInput) => {
    if (!transferId) return;
    try {
      await api.post(`/users/${transferId}/transfer`, { ...values, to_position_id: values.to_position_id || undefined });
      qc.invalidateQueries({ queryKey: ['users'] });
      setTransferId(null); transferForm.reset(); push(t('users.transfer'));
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  const toggleStatus = async (id: string, status: 'active' | 'inactive') => {
    try {
      await api.patch(`/users/${id}/status`, { status: status === 'active' ? 'inactive' : 'active' });
      qc.invalidateQueries({ queryKey: ['users'] });
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  const resetPassword = async (id: string) => {
    try {
      const res = await api.post(`/users/${id}/reset-password`);
      setTempPassword(res.data.temporary_password);
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  const openEdit = (u: any) => {
    setEditUser(u);
    setEditData({ full_name: u.full_name ?? '', phone: u.phone ?? '', department_id: u.department_id ?? '' });
  };

  const saveEdit = async () => {
    if (!editUser) return;
    try {
      await api.patch(`/users/${editUser.id}`, {
        full_name: editData.full_name,
        phone: editData.phone || undefined,
        department_id: editData.department_id || undefined,
      });
      qc.invalidateQueries({ queryKey: ['users'] });
      setEditUser(null);
      push(t('users.userUpdated'));
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  const deleteUser = async (u: any) => {
    if (!confirm(t('users.deleteConfirm', { name: u.full_name }))) return;
    try {
      await api.delete(`/users/${u.id}`);
      qc.invalidateQueries({ queryKey: ['users'] });
      push(t('users.userDeleted'));
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  return (
    <RequireAuth>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-5 gap-2">
          <h1 className="text-xl font-medium">{t('users.title')}</h1>
          {can('users', 'create') && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button>{t('users.newUser')}</Button></DialogTrigger>
              <DialogContent title={t('users.createUser')}>
                <form onSubmit={createForm.handleSubmit(onCreate)} className="flex flex-col gap-3">
                  <div><Label>{t('users.fullName')}</Label><Input {...createForm.register('full_name')} /></div>
                  <div><Label>{t('common.email')}</Label><Input type="email" {...createForm.register('email')} /></div>
                  <div><Label>{t('common.department')}</Label><Select {...createForm.register('department_id')}><option value="">{t('common.selectPlaceholder')}</option>{depts?.data.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></div>
                  <div><Label>{t('common.role')}</Label><Select {...createForm.register('role_id')}><option value="">{t('common.selectPlaceholder')}</option>{roles?.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select></div>
                  <div><Label>{t('common.phone')}</Label><Input {...createForm.register('phone')} /></div>
                  <div className="flex justify-end gap-2 mt-2">
                    <Button type="button" variant="secondary" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
                    <Button type="submit" disabled={createForm.formState.isSubmitting}>{t('common.create')}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {tempPassword && (
          <div className="mb-4 rounded-md bg-gold/20 border border-gold/50 p-3 text-xs flex justify-between items-center gap-2">
            <span className="break-all">{t('users.temporaryPassword')}: <code className="font-mono font-medium">{tempPassword}</code> — {t('users.shareSecurely')}</span>
            <button onClick={() => setTempPassword(null)} className="text-muted-foreground flex-none">✕</button>
          </div>
        )}

        {isLoading && <Skeleton className="h-64" />}
        {data && data.data.length === 0 && <EmptyState title={t('users.noUsersYet')} />}
        {data && data.data.length > 0 && (
          <div className="rounded-lg border border-input bg-white overflow-hidden">
            {data.data.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 border-t first:border-t-0 border-input text-sm">
                <Avatar name={u.full_name} size={28} />
                <div className="flex-1 min-w-[140px]">
                  <div className="truncate">{u.full_name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{u.email}</div>
                </div>
                <span className="hidden sm:inline text-[11px] text-muted-foreground w-32 truncate">{deptName(u.department_id)}</span>
                <Badge tone={u.status === 'active' ? 'teal' : 'gray'}>{u.status === 'active' ? t('common.active') : t('common.inactive')}</Badge>
                {can('users', 'manage') && !u.is_system_owner && (
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
                    {can('users', 'edit') && <button onClick={() => openEdit(u)} className="text-[11px] text-accent">{t('users.editInfo')}</button>}
                    <button onClick={() => setTransferId(u.id)} className="text-[11px] text-accent">{t('users.transfer')}</button>
                    <button onClick={() => resetPassword(u.id)} className="text-[11px] text-accent">{t('users.resetPassword')}</button>
                    <button onClick={() => toggleStatus(u.id, u.status)} className={`text-[11px] ${u.status === 'active' ? 'text-destructive' : 'text-accent'}`}>
                      {u.status === 'active' ? t('users.deactivate') : t('users.activate')}
                    </button>
                    {isSystemOwner && <button onClick={() => deleteUser(u)} className="text-[11px] text-destructive font-medium">{t('users.deleteUser')}</button>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {data && data.meta.total_pages > 1 && <Pagination page={page} totalPages={data.meta.total_pages} onChange={setPage} />}

        <Dialog open={!!transferId} onOpenChange={(o) => !o && setTransferId(null)}>
          <DialogContent title={t('users.transferUser')}>
            <form onSubmit={transferForm.handleSubmit(onTransfer)} className="flex flex-col gap-3">
              <div><Label>{t('users.newDepartment')}</Label><Select {...transferForm.register('to_department_id')}><option value="">{t('common.selectPlaceholder')}</option>{depts?.data.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></div>
              <div><Label>{t('users.reason')}</Label><Input {...transferForm.register('reason')} /></div>
              <div className="flex justify-end gap-2 mt-2">
                <Button type="button" variant="secondary" onClick={() => setTransferId(null)}>{t('common.cancel')}</Button>
                <Button type="submit">{t('users.transfer')}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
          <DialogContent title={t('users.editUser')}>
            <div className="flex flex-col gap-3">
              <div><Label>{t('users.fullName')}</Label><Input value={editData.full_name} onChange={(e) => setEditData({ ...editData, full_name: e.target.value })} /></div>
              <div><Label>{t('common.phone')}</Label><Input value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} /></div>
              <div>
                <Label>{t('common.department')}</Label>
                <Select value={editData.department_id} onChange={(e) => setEditData({ ...editData, department_id: e.target.value })}>
                  <option value="">{t('common.selectPlaceholder')}</option>
                  {depts?.data.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button type="button" variant="secondary" onClick={() => setEditUser(null)}>{t('common.cancel')}</Button>
                <Button type="button" onClick={saveEdit}>{t('users.save')}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RequireAuth>
  );
}
