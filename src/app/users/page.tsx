'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RequireAuth } from '@/components/layout/require-auth';
import { useUsers, useDepartments, useRoles } from '@/hooks/use-resources';
import { usePermission } from '@/hooks/use-permission';
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
  const [page, setPage] = useState(1);
  const { data, isLoading } = useUsers({ page, page_size: 20 });
  const { data: depts } = useDepartments({ page: 1, page_size: 100 });
  const { data: roles } = useRoles();
  const { can } = usePermission();
  const { push } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [transferId, setTransferId] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

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
      setTransferId(null); transferForm.reset(); push('User transferred');
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

  return (
    <RequireAuth>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-medium">Users</h1>
          {can('users', 'create') && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button>New User</Button></DialogTrigger>
              <DialogContent title="Create User">
                <form onSubmit={createForm.handleSubmit(onCreate)} className="flex flex-col gap-3">
                  <div><Label>Full name</Label><Input {...createForm.register('full_name')} /></div>
                  <div><Label>Email</Label><Input type="email" {...createForm.register('email')} /></div>
                  <div><Label>Department</Label><Select {...createForm.register('department_id')}><option value="">Select…</option>{depts?.data.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></div>
                  <div><Label>Role</Label><Select {...createForm.register('role_id')}><option value="">Select…</option>{roles?.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select></div>
                  <div><Label>Phone</Label><Input {...createForm.register('phone')} /></div>
                  <div className="flex justify-end gap-2 mt-2">
                    <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createForm.formState.isSubmitting}>Create</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {tempPassword && (
          <div className="mb-4 rounded-md bg-gold/20 border border-gold/50 p-3 text-xs flex justify-between items-center">
            <span>Temporary password: <code className="font-mono font-medium">{tempPassword}</code> — share this securely; it won't be shown again.</span>
            <button onClick={() => setTempPassword(null)} className="text-muted-foreground">✕</button>
          </div>
        )}

        {isLoading && <Skeleton className="h-64" />}
        {data && data.data.length === 0 && <EmptyState title="No users yet" />}
        {data && data.data.length > 0 && (
          <div className="rounded-lg border border-input bg-white overflow-hidden">
            {data.data.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3 border-t first:border-t-0 border-input text-sm">
                <Avatar name={u.full_name} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{u.full_name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{u.email}</div>
                </div>
                <span className="text-[11px] text-muted-foreground w-32">{deptName(u.department_id)}</span>
                <Badge tone={u.status === 'active' ? 'teal' : 'gray'}>{u.status}</Badge>
                {can('users', 'manage') && !u.is_system_owner && (
                  <>
                    <button onClick={() => setTransferId(u.id)} className="text-[11px] text-accent">Transfer</button>
                    <button onClick={() => resetPassword(u.id)} className="text-[11px] text-accent">Reset PW</button>
                    <button onClick={() => toggleStatus(u.id, u.status)} className={`text-[11px] ${u.status === 'active' ? 'text-destructive' : 'text-accent'}`}>
                      {u.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        {data && data.meta.total_pages > 1 && <Pagination page={page} totalPages={data.meta.total_pages} onChange={setPage} />}

        <Dialog open={!!transferId} onOpenChange={(o) => !o && setTransferId(null)}>
          <DialogContent title="Transfer User">
            <form onSubmit={transferForm.handleSubmit(onTransfer)} className="flex flex-col gap-3">
              <div><Label>New Department</Label><Select {...transferForm.register('to_department_id')}><option value="">Select…</option>{depts?.data.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></div>
              <div><Label>Reason</Label><Input {...transferForm.register('reason')} /></div>
              <div className="flex justify-end gap-2 mt-2">
                <Button type="button" variant="secondary" onClick={() => setTransferId(null)}>Cancel</Button>
                <Button type="submit">Transfer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RequireAuth>
  );
}
