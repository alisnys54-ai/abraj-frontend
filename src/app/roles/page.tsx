'use client';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RequireAuth } from '@/components/layout/require-auth';
import { useRoles, usePermissionCatalog, useRolePermissions } from '@/hooks/use-resources';
import { usePermission } from '@/hooks/use-permission';
import { api, apiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { createRoleSchema, type CreateRoleInput, type RoleRow, PERMISSION_MODULES, PERMISSION_ACTIONS } from '@/lib/schemas/role';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/states';

const SCOPE_OPTIONS = [
  { value: 'own', label: 'Own only' },
  { value: 'department', label: 'Department' },
  { value: 'all', label: 'All (company-wide)' },
] as const;

type Scope = 'all' | 'department' | 'own';

function ManagePermissions({ role, onClose }: { role: RoleRow; onClose: () => void }) {
  const { data: catalog, isLoading: catalogLoading } = usePermissionCatalog();
  const { data: current, isLoading: currentLoading } = useRolePermissions(role.id);
  const { push } = useToast();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [grants, setGrants] = useState<Record<string, Set<string>>>({});
  const [scopeByModule, setScopeByModule] = useState<Record<string, Scope>>({});

  useEffect(() => {
    if (!current) return;
    const g: Record<string, Set<string>> = {};
    const s: Record<string, Scope> = {};
    for (const row of current as { permission: { module: string; action: string }; scope: Scope; granted: boolean }[]) {
      if (!row.granted) continue;
      if (!g[row.permission.module]) g[row.permission.module] = new Set();
      g[row.permission.module].add(row.permission.action);
      s[row.permission.module] = row.scope;
    }
    setGrants(g);
    setScopeByModule(s);
  }, [current]);

  const toggle = (module: string, action: string) => {
    setGrants((prev) => {
      const next = { ...prev, [module]: new Set(prev[module] ?? []) };
      if (next[module].has(action)) next[module].delete(action);
      else next[module].add(action);
      return next;
    });
    setScopeByModule((prev) => (prev[module] ? prev : { ...prev, [module]: 'own' }));
  };

  const onSave = async () => {
    if (!catalog) return;
    const permissions: { permission_id: string; scope: Scope; granted: boolean }[] = [];
    for (const entry of catalog as { id: string; module: string; action: string }[]) {
      if (grants[entry.module]?.has(entry.action)) {
        permissions.push({ permission_id: entry.id, scope: scopeByModule[entry.module] ?? 'own', granted: true });
      }
    }
    if (permissions.length === 0) {
      push('Grant at least one permission before saving', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/roles/${role.id}/permissions`, { permissions });
      qc.invalidateQueries({ queryKey: ['role-permissions', role.id] });
      push('Permissions updated');
      onClose();
    } catch (e) {
      push(apiErrorMessage(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  const loading = catalogLoading || currentLoading;

  return (
    <DialogContent title={`Permissions — ${role.name}`} className="max-w-3xl max-h-[85vh] overflow-y-auto">
      {loading && <Skeleton className="h-64" />}
      {!loading && (
        <div className="flex flex-col gap-1">
          <div className="grid grid-cols-[140px_1fr_140px] gap-2 text-[11px] font-medium text-muted-foreground pb-2 border-b border-input mb-2">
            <span>Module</span>
            <span>Actions</span>
            <span>Scope</span>
          </div>
          {PERMISSION_MODULES.map((module) => (
            <div key={module} className="grid grid-cols-[140px_1fr_140px] gap-2 items-start py-2 border-b border-input/60">
              <span className="text-xs font-medium capitalize pt-1">{module.replace(/-/g, ' ')}</span>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                {PERMISSION_ACTIONS.map((action) => (
                  <label key={action} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Checkbox
                      checked={!!grants[module]?.has(action)}
                      onCheckedChange={() => toggle(module, action)}
                    />
                    {action}
                  </label>
                ))}
              </div>
              <Select
                className="h-7 text-[11px]"
                value={scopeByModule[module] ?? 'own'}
                onChange={(e) => setScopeByModule((prev) => ({ ...prev, [module]: e.target.value as Scope }))}
                disabled={!grants[module]?.size}
              >
                {SCOPE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </div>
          ))}
          <div className="flex justify-end gap-2 mt-4 sticky bottom-0 bg-white pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save Permissions'}</Button>
          </div>
        </div>
      )}
    </DialogContent>
  );
}

export default function RolesPage() {
  const { data: roles, isLoading } = useRoles();
  const { can, isSystemOwner } = usePermission();
  const { push } = useToast();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [permRole, setPermRole] = useState<RoleRow | null>(null);
  const [editRole, setEditRole] = useState<RoleRow | null>(null);

  const createForm = useForm<CreateRoleInput>({ resolver: zodResolver(createRoleSchema) });
  const editForm = useForm<{ name: string; description: string }>();

  const onCreate = async (values: CreateRoleInput) => {
    try {
      await api.post('/roles', {
        name: values.name,
        description: values.description || undefined,
        clone_from_role_id: values.clone_from_role_id || undefined,
      });
      qc.invalidateQueries({ queryKey: ['roles'] });
      setCreateOpen(false);
      createForm.reset();
      push('Role created — open "Permissions" to configure access');
    } catch (e) {
      push(apiErrorMessage(e), 'error');
    }
  };

  const onEdit = async (values: { name: string; description: string }) => {
    if (!editRole) return;
    try {
      await api.patch(`/roles/${editRole.id}`, {
        name: editRole.isSystemRole ? undefined : values.name,
        description: values.description || undefined,
      });
      qc.invalidateQueries({ queryKey: ['roles'] });
      setEditRole(null);
      push('Role updated');
    } catch (e) {
      push(apiErrorMessage(e), 'error');
    }
  };

  const onDelete = async (role: RoleRow) => {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/roles/${role.id}`);
      qc.invalidateQueries({ queryKey: ['roles'] });
      push('Role deleted');
    } catch (e) {
      push(apiErrorMessage(e), 'error');
    }
  };

  return (
    <RequireAuth>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-medium">Roles</h1>
            <p className="text-xs text-muted-foreground mt-1">Create custom roles and configure exactly what each one can access.</p>
          </div>
          {(can('roles', 'create') || isSystemOwner) && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild><Button>New Role</Button></DialogTrigger>
              <DialogContent title="Create Role">
                <form onSubmit={createForm.handleSubmit(onCreate)} className="flex flex-col gap-3">
                  <div><Label>Name</Label><Input {...createForm.register('name')} placeholder="e.g. Site Supervisor" /></div>
                  <div><Label>Description</Label><Input {...createForm.register('description')} placeholder="Optional" /></div>
                  <div>
                    <Label>Clone permissions from (optional)</Label>
                    <Select {...createForm.register('clone_from_role_id')}>
                      <option value="">Start empty</option>
                      {roles?.map((r: RoleRow) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createForm.formState.isSubmitting}>Create</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading && <Skeleton className="h-64" />}
        {roles && roles.length === 0 && <EmptyState title="No roles yet" />}
        {roles && roles.length > 0 && (
          <div className="rounded-lg border border-input bg-white overflow-hidden">
            {roles.map((r: RoleRow) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-t first:border-t-0 border-input text-sm">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{r.name}</span>
                    {r.isSystemRole && <Badge tone="slate">System</Badge>}
                  </div>
                  {r.description && <div className="text-[11px] text-muted-foreground truncate mt-0.5">{r.description}</div>}
                </div>
                <button className="text-[11px] text-accent" onClick={() => setPermRole(r)}>Permissions</button>
                {(can('roles', 'edit') || isSystemOwner) && (
                  <button
                    className="text-[11px] text-accent"
                    onClick={() => { setEditRole(r); editForm.reset({ name: r.name, description: r.description ?? '' }); }}
                  >
                    Edit
                  </button>
                )}
                {!r.isSystemRole && (can('roles', 'delete') || isSystemOwner) && (
                  <button className="text-[11px] text-destructive" onClick={() => onDelete(r)}>Delete</button>
                )}
              </div>
            ))}
          </div>
        )}

        <Dialog open={!!permRole} onOpenChange={(o) => !o && setPermRole(null)}>
          {permRole && <ManagePermissions role={permRole} onClose={() => setPermRole(null)} />}
        </Dialog>

        <Dialog open={!!editRole} onOpenChange={(o) => !o && setEditRole(null)}>
          <DialogContent title={`Edit Role${editRole?.isSystemRole ? ' (system role — name locked)' : ''}`}>
            <form onSubmit={editForm.handleSubmit(onEdit)} className="flex flex-col gap-3">
              <div><Label>Name</Label><Input {...editForm.register('name')} disabled={editRole?.isSystemRole} /></div>
              <div><Label>Description</Label><Input {...editForm.register('description')} /></div>
              <div className="flex justify-end gap-2 mt-2">
                <Button type="button" variant="secondary" onClick={() => setEditRole(null)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RequireAuth>
  );
}
