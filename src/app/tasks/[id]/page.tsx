'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { RequireAuth } from '@/components/layout/require-auth';
import { useTask, useTaskHistory, useTaskComments, useTaskChecklists, useTaskAttachments } from '@/hooks/use-tasks';
import { useTaskStatuses, useTaskPriorities, useUsers } from '@/hooks/use-resources';
import { usePermission } from '@/hooks/use-permission';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ui/toast';
import { useLocale } from '@/lib/i18n/locale-context';
import { api, apiErrorMessage } from '@/lib/api-client';
import { StatusBadge, PriorityBadge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/states';
import { formatDate } from '@/lib/utils';

export default function Page() {
  const { t } = useLocale();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { push } = useToast();
  const { user } = useAuth();
  const { can } = usePermission();

  const { data: task, isLoading, isError, refetch } = useTask(id);
  const { data: statuses } = useTaskStatuses();
  const { data: priorities } = useTaskPriorities();
  const { data: users } = useUsers({ page: 1, page_size: 200 });
  const { data: history } = useTaskHistory(id);
  const { data: comments } = useTaskComments(id);
  const { data: checklists } = useTaskChecklists(id);
  const { data: attachments } = useTaskAttachments(id);

  const [newStatusId, setNewStatusId] = useState('');
  const [reason, setReason] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [reassignTo, setReassignTo] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', priority_id: '', due_date: '' });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['task', id] });
    qc.invalidateQueries({ queryKey: ['task-history', id] });
    qc.invalidateQueries({ queryKey: ['task-comments', id] });
    qc.invalidateQueries({ queryKey: ['task-checklists', id] });
    qc.invalidateQueries({ queryKey: ['task-attachments', id] });
  };

  const changeStatus = async () => {
    if (!newStatusId) return;
    try {
      await api.post(`/tasks/${id}/status`, { to_status_id: newStatusId, reason: reason || undefined });
      setNewStatusId(''); setReason('');
      invalidateAll();
      push(t('tasks.statusUpdated'));
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  const reassign = async () => {
    if (!reassignTo) return;
    try {
      await api.post(`/tasks/${id}/assign`, { assignee_id: reassignTo });
      setReassignTo(''); invalidateAll(); push(t('tasks.taskReassigned'));
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  const toggleWatch = async (watching: boolean) => {
    try {
      if (watching) await api.delete(`/tasks/${id}/watchers/${user!.id}`);
      else await api.post(`/tasks/${id}/watchers`, { user_id: user!.id });
      invalidateAll();
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  const postComment = async () => {
    if (!commentBody.trim()) return;
    try {
      await api.post(`/tasks/${id}/comments`, { body: commentBody });
      setCommentBody(''); qc.invalidateQueries({ queryKey: ['task-comments', id] });
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  const addChecklistItem = async () => {
    if (!newChecklistItem.trim() || !checklists?.checklists?.[0]) return;
    try {
      await api.post(`/checklists/${checklists.checklists[0].id}/items`, { text: newChecklistItem });
      setNewChecklistItem(''); qc.invalidateQueries({ queryKey: ['task-checklists', id] });
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  const createChecklistGroup = async () => {
    try {
      await api.post(`/tasks/${id}/checklists`, {});
      qc.invalidateQueries({ queryKey: ['task-checklists', id] });
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  const toggleChecklistItem = async (itemId: string, is_done: boolean) => {
    try {
      await api.patch(`/checklist-items/${itemId}`, { is_done });
      qc.invalidateQueries({ queryKey: ['task-checklists', id] });
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  const duplicate = async () => {
    try {
      const res = await api.post(`/tasks/${id}/duplicate`);
      router.push(`/tasks/${res.data.id}`);
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  const openEdit = () => {
    if (!task) return;
    setEditForm({
      title: task.title ?? '',
      description: task.description ?? '',
      priority_id: task.priority?.id ?? '',
      due_date: task.due_date ? task.due_date.slice(0, 10) : '',
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    try {
      await api.patch(`/tasks/${id}`, {
        title: editForm.title,
        description: editForm.description || undefined,
        priority_id: editForm.priority_id || undefined,
        due_date: editForm.due_date || null,
      });
      setEditOpen(false);
      invalidateAll();
      push(t('tasks.taskUpdated'));
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  const removeTask = async () => {
    if (!confirm(t('tasks.deleteConfirm'))) return;
    try {
      await api.delete(`/tasks/${id}`);
      push(t('tasks.taskDeleted'));
      router.push('/tasks');
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  // Simple employee workflow: move to a target status by its name.
  const moveToStatus = async (statusName: string, successMsg: string) => {
    const target = statuses?.find((s) => s.name === statusName);
    if (!target) { push(apiErrorMessage(new Error('status not available')), 'error'); return; }
    try {
      await api.post(`/tasks/${id}/status`, { to_status_id: target.id });
      invalidateAll();
      push(successMsg);
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };
  const acceptTask = () => moveToStatus('in_progress', t('tasks.accepted'));
  const finishTask = () => moveToStatus('waiting_approval', t('tasks.finished'));

  const [uploading, setUploading] = useState(false);
  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      await api.post(`/tasks/${id}/attachments/direct`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      qc.invalidateQueries({ queryKey: ['task-attachments', id] });
      push(t('tasks.fileUploaded'));
    } catch (e) { push(apiErrorMessage(e), 'error'); }
    finally { setUploading(false); }
  };

  if (isLoading) return <RequireAuth><Skeleton className="h-64" /></RequireAuth>;
  if (isError || !task) return <RequireAuth><ErrorState title={t('tasks.taskNotFound')} onRetry={() => refetch()} /></RequireAuth>;

  const isWatching = (task.watchers ?? []).some((w) => w.user_id === user?.id);

  return (
    <RequireAuth>
      <div className="max-w-5xl">
        <button onClick={() => router.push('/tasks')} className="text-xs text-accent mb-3">← {t('tasks.backToTasks')}</button>
        <div className="flex items-start justify-between gap-4 mb-1 flex-wrap">
          <div>
            <div className="text-[11px] text-muted-foreground mb-1">{task.code}</div>
            <h1 className="text-xl font-medium">{task.title}</h1>
          </div>
          <div className="flex gap-2">
            <PriorityBadge name={task.priority.name} />
            <StatusBadge name={task.status.name} />
          </div>
        </div>
        <div className="flex gap-4 text-[11px] text-muted-foreground mb-5 flex-wrap">
          <span>{t('tasks.due')}: {formatDate(task.due_date)}</span>
          <span>{t('tasks.created')}: {formatDate(task.created_at)}</span>
          {task.is_overdue && <span className="text-destructive font-medium">{t('tasks.overdue')}</span>}
        </div>

        {task.is_blocked && (
          <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
            <div className="font-medium mb-1">{t('tasks.blocked')}</div>
            {(task.blocking_reasons ?? []).map((r, i) => <div key={i}>{r}</div>)}
          </div>
        )}

        {/* Simple employee action bar — big, obvious primary action by status */}
        {can('tasks', 'edit') && (task.status.name === 'pending' || task.status.name === 'in_progress') && (
          <div className="mb-4 rounded-lg border border-input bg-white p-4 flex flex-wrap items-center gap-3">
            {task.status.name === 'pending' && (
              <Button onClick={acceptTask} className="min-w-[160px]">{t('tasks.accept')}</Button>
            )}
            {task.status.name === 'in_progress' && (
              <Button onClick={finishTask} className="min-w-[160px]">{t('tasks.finish')}</Button>
            )}
            <label className="inline-flex items-center gap-2 text-xs font-medium text-accent cursor-pointer">
              <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" disabled={uploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.currentTarget.value = ''; }} />
              📎 {uploading ? t('tasks.uploading') : t('tasks.uploadFile')}
            </label>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-5">
          <div className="flex flex-col gap-4 min-w-0">
            <Card><CardContent>
              <div className="text-xs font-medium text-muted-foreground mb-2">{t('tasks.description')}</div>
              <p className="text-sm whitespace-pre-wrap">{task.description || '—'}</p>
            </CardContent></Card>

            <Tabs defaultValue="checklist">
              <TabsList className="overflow-x-auto max-w-full">
                <TabsTrigger value="checklist">{t('tasks.checklist')}</TabsTrigger>
                <TabsTrigger value="comments">{t('tasks.comments')}</TabsTrigger>
                <TabsTrigger value="attachments">{t('tasks.attachments')}</TabsTrigger>
                <TabsTrigger value="activity">{t('tasks.activity')}</TabsTrigger>
              </TabsList>

              <TabsContent value="checklist">
                <Card className="mt-3"><CardContent>
                  {!checklists?.checklists?.length && (
                    <Button size="sm" variant="secondary" onClick={createChecklistGroup}>{t('tasks.addChecklist')}</Button>
                  )}
                  {checklists?.checklists?.map((c: any) => (
                    <div key={c.id} className="mb-3">
                      <div className="text-xs font-medium mb-2">{c.title} — {checklists.progress_percent}%</div>
                      <div className="flex flex-col gap-1.5">
                        {c.items.map((it: any) => (
                          <label key={it.id} className="flex items-center gap-2 text-sm">
                            <Checkbox checked={it.is_done} onCheckedChange={(v) => toggleChecklistItem(it.id, !!v)} />
                            <span className={it.is_done ? 'line-through text-muted-foreground' : ''}>{it.text}</span>
                          </label>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Input value={newChecklistItem} onChange={(e) => setNewChecklistItem(e.target.value)} placeholder={t('tasks.addItem')} className="h-8 text-xs" />
                        <Button size="sm" variant="secondary" onClick={addChecklistItem}>{t('tasks.add')}</Button>
                      </div>
                    </div>
                  ))}
                </CardContent></Card>
              </TabsContent>

              <TabsContent value="comments">
                <Card className="mt-3"><CardContent>
                  <div className="flex flex-col gap-3 mb-4">
                    {comments?.data?.map((c: any) => (
                      <div key={c.id} className="border-t border-input pt-3 first:border-t-0 first:pt-0">
                        <div className="flex justify-between text-xs mb-1"><span className="font-medium">{c.author.full_name}</span><span className="text-muted-foreground">{formatDate(c.created_at)}</span></div>
                        <p className="text-sm">{c.body}</p>
                      </div>
                    ))}
                    {!comments?.data?.length && <p className="text-xs text-muted-foreground">{t('tasks.noComments')}</p>}
                  </div>
                  <Textarea value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder={t('tasks.writeComment')} className="mb-2" />
                  <Button size="sm" onClick={postComment}>{t('tasks.post')}</Button>
                </CardContent></Card>
              </TabsContent>

              <TabsContent value="attachments">
                <Card className="mt-3"><CardContent>
                  {can('attachments', 'upload') && (
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-white bg-primary rounded-md px-3 py-2 cursor-pointer mb-3">
                      <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" disabled={uploading}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.currentTarget.value = ''; }} />
                      📎 {uploading ? t('tasks.uploading') : t('tasks.addAttachment')}
                    </label>
                  )}
                  {attachments?.map((a: any) => {
                    const isImg = (a.mime_type || '').startsWith('image/');
                    const fileUrl = `${process.env.NEXT_PUBLIC_API_URL}/attachments/${a.id}/file`;
                    return (
                      <div key={a.id} className="flex items-center justify-between gap-3 text-sm py-2 border-t border-input first:border-t-0">
                        <span className="flex items-center gap-2 min-w-0">
                          <span>{isImg ? '🖼️' : '📎'}</span>
                          <span className="truncate">{a.file_name} <span className="text-muted-foreground">(v{a.version_number})</span></span>
                        </span>
                        <a href={fileUrl} target="_blank" rel="noreferrer" className="text-[11px] text-accent flex-none">{t('tasks.download')}</a>
                      </div>
                    );
                  })}
                  {!attachments?.length && <p className="text-xs text-muted-foreground">{t('tasks.noAttachments')}</p>}
                </CardContent></Card>
              </TabsContent>

              <TabsContent value="activity">
                <Card className="mt-3"><CardContent>
                  {history?.data?.map((h: any) => (
                    <div key={h.id} className="flex justify-between text-xs py-1.5 border-t border-input first:border-t-0">
                      <span>{h.action.replace(/_/g, ' ')}{h.field_name ? ` — ${h.field_name}` : ''}</span>
                      <span className="text-muted-foreground">{formatDate(h.created_at)}</span>
                    </div>
                  ))}
                  {!history?.data?.length && <p className="text-xs text-muted-foreground">{t('tasks.noActivity')}</p>}
                </CardContent></Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex flex-col gap-4 min-w-0">
            <Card><CardContent>
              <div className="text-[10px] uppercase text-muted-foreground mb-2">{t('tasks.assignee')}</div>
              <div className="text-sm mb-3">{task.assignee?.full_name ?? t('tasks.unassigned')}</div>
              {can('tasks', 'assign') && (
                <div className="flex gap-2">
                  <Select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)} className="text-xs">
                    <option value="">{t('tasks.reassignTo')}</option>
                    {users?.data.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                  </Select>
                  <Button size="sm" variant="secondary" onClick={reassign}>{t('tasks.go')}</Button>
                </div>
              )}
            </CardContent></Card>

            {can('tasks', 'edit') && (
              <Card><CardContent>
                <div className="text-[10px] uppercase text-muted-foreground mb-2">{t('tasks.changeStatus')}</div>
                <Select value={newStatusId} onChange={(e) => setNewStatusId(e.target.value)} className="mb-2 text-xs">
                  <option value="">{t('tasks.selectTargetStatus')}</option>
                  {statuses?.map((s) => <option key={s.id} value={s.id}>{s.name.replace(/_/g, ' ')}</option>)}
                </Select>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('tasks.reasonPlaceholder')} className="mb-2 text-xs" />
                <Button size="sm" onClick={changeStatus} className="w-full">{t('tasks.apply')}</Button>
              </CardContent></Card>
            )}

            <Card><CardContent>
              {can('tasks', 'edit') && <Button size="sm" variant="outline" className="w-full mb-2" onClick={openEdit}>{t('tasks.editTask')}</Button>}
              <Button size="sm" variant={isWatching ? 'secondary' : 'outline'} className="w-full mb-2" onClick={() => toggleWatch(isWatching)}>
                {isWatching ? t('tasks.watching') : t('tasks.watchThisTask')}
              </Button>
              {can('tasks', 'create') && <Button size="sm" variant="outline" className="w-full mb-2" onClick={duplicate}>{t('tasks.duplicate')}</Button>}
              {can('tasks', 'delete') && <Button size="sm" variant="outline" className="w-full text-destructive" onClick={removeTask}>{t('tasks.deleteTask')}</Button>}
            </CardContent></Card>

            {(task.dependencies_from?.length || task.dependencies_to?.length) ? (
              <Card><CardContent>
                <div className="text-[10px] uppercase text-muted-foreground mb-2">{t('tasks.dependencies')}</div>
                {task.dependencies_from?.map((d) => <div key={d.id} className="text-xs mb-1">{t('tasks.dependsOn')}: {d.depends_on.title} ({d.type})</div>)}
                {task.dependencies_to?.map((d) => <div key={d.id} className="text-xs mb-1">{t('tasks.blocks')}: {d.task.title} ({d.type})</div>)}
              </CardContent></Card>
            ) : null}
          </div>
        </div>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent title={t('tasks.editTask')}>
            <div className="flex flex-col gap-3">
              <div><Label>{t('tasks.titleField')}</Label><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} /></div>
              <div><Label>{t('tasks.description')}</Label><Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t('tasks.priority')}</Label>
                  <Select value={editForm.priority_id} onChange={(e) => setEditForm({ ...editForm, priority_id: e.target.value })}>
                    <option value="">{t('common.selectPlaceholder')}</option>
                    {priorities?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                </div>
                <div><Label>{t('tasks.dueDate')}</Label><Input type="date" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="secondary" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
                <Button onClick={saveEdit}>{t('tasks.saveChanges')}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RequireAuth>
  );
}
