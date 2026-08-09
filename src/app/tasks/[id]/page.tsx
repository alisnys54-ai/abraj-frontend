'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { RequireAuth } from '@/components/layout/require-auth';
import { useTask, useTaskHistory, useTaskComments, useTaskChecklists, useTaskAttachments } from '@/hooks/use-tasks';
import { useTaskStatuses, useUsers } from '@/hooks/use-resources';
import { usePermission } from '@/hooks/use-permission';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ui/toast';
import { useLocale } from '@/lib/i18n/locale-context';
import { api, apiErrorMessage } from '@/lib/api-client';
import { StatusBadge, PriorityBadge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
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
                  {attachments?.map((a: any) => (
                    <div key={a.id} className="flex justify-between text-sm py-1.5 border-t border-input first:border-t-0">
                      <span>📎 {a.file_name} (v{a.version_number})</span>
                    </div>
                  ))}
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
              <Button size="sm" variant={isWatching ? 'secondary' : 'outline'} className="w-full mb-2" onClick={() => toggleWatch(isWatching)}>
                {isWatching ? t('tasks.watching') : t('tasks.watchThisTask')}
              </Button>
              {can('tasks', 'create') && <Button size="sm" variant="outline" className="w-full" onClick={duplicate}>{t('tasks.duplicate')}</Button>}
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
      </div>
    </RequireAuth>
  );
}
