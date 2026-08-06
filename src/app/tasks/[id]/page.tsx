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
      push('Status updated');
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  const reassign = async () => {
    if (!reassignTo) return;
    try {
      await api.post(`/tasks/${id}/assign`, { assignee_id: reassignTo });
      setReassignTo(''); invalidateAll(); push('Task reassigned');
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
  if (isError || !task) return <RequireAuth><ErrorState title="Task not found" onRetry={() => refetch()} /></RequireAuth>;

  const isWatching = (task.watchers ?? []).some((w) => w.user_id === user?.id);

  return (
    <RequireAuth>
      <div className="max-w-5xl">
        <button onClick={() => router.push('/tasks')} className="text-xs text-accent mb-3">← Back to Tasks</button>
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
        <div className="flex gap-4 text-[11px] text-muted-foreground mb-5">
          <span>Due: {formatDate(task.due_date)}</span>
          <span>Created: {formatDate(task.created_at)}</span>
          {task.is_overdue && <span className="text-destructive font-medium">Overdue</span>}
        </div>

        {task.is_blocked && (
          <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
            <div className="font-medium mb-1">This task is blocked</div>
            {(task.blocking_reasons ?? []).map((r, i) => <div key={i}>{r}</div>)}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-5">
          <div className="flex flex-col gap-4">
            <Card><CardContent>
              <div className="text-xs font-medium text-muted-foreground mb-2">Description</div>
              <p className="text-sm whitespace-pre-wrap">{task.description || '—'}</p>
            </CardContent></Card>

            <Tabs defaultValue="checklist">
              <TabsList>
                <TabsTrigger value="checklist">Checklist</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="checklist">
                <Card className="mt-3"><CardContent>
                  {!checklists?.checklists?.length && (
                    <Button size="sm" variant="secondary" onClick={createChecklistGroup}>Add checklist</Button>
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
                        <Input value={newChecklistItem} onChange={(e) => setNewChecklistItem(e.target.value)} placeholder="Add an item…" className="h-8 text-xs" />
                        <Button size="sm" variant="secondary" onClick={addChecklistItem}>Add</Button>
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
                    {!comments?.data?.length && <p className="text-xs text-muted-foreground">No comments yet.</p>}
                  </div>
                  <Textarea value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="Write a comment…" className="mb-2" />
                  <Button size="sm" onClick={postComment}>Post</Button>
                </CardContent></Card>
              </TabsContent>

              <TabsContent value="attachments">
                <Card className="mt-3"><CardContent>
                  {attachments?.map((a: any) => (
                    <div key={a.id} className="flex justify-between text-sm py-1.5 border-t border-input first:border-t-0">
                      <span>📎 {a.file_name} (v{a.version_number})</span>
                    </div>
                  ))}
                  {!attachments?.length && <p className="text-xs text-muted-foreground">No attachments. File upload UI connects to POST /tasks/:id/attachments/upload-url once a storage backend (MinIO/S3) is live — currently a local-disk stand-in per backend design.</p>}
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
                  {!history?.data?.length && <p className="text-xs text-muted-foreground">No activity yet.</p>}
                </CardContent></Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex flex-col gap-4">
            <Card><CardContent>
              <div className="text-[10px] uppercase text-muted-foreground mb-2">Assignee</div>
              <div className="text-sm mb-3">{task.assignee?.full_name ?? 'Unassigned'}</div>
              {can('tasks', 'assign') && (
                <div className="flex gap-2">
                  <Select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)} className="text-xs">
                    <option value="">Reassign to…</option>
                    {users?.data.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                  </Select>
                  <Button size="sm" variant="secondary" onClick={reassign}>Go</Button>
                </div>
              )}
            </CardContent></Card>

            {can('tasks', 'edit') && (
              <Card><CardContent>
                <div className="text-[10px] uppercase text-muted-foreground mb-2">Change Status</div>
                <Select value={newStatusId} onChange={(e) => setNewStatusId(e.target.value)} className="mb-2 text-xs">
                  <option value="">Select target status…</option>
                  {statuses?.map((s) => <option key={s.id} value={s.id}>{s.name.replace(/_/g, ' ')}</option>)}
                </Select>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (required for reject/cancel)" className="mb-2 text-xs" />
                <Button size="sm" onClick={changeStatus} className="w-full">Apply</Button>
              </CardContent></Card>
            )}

            <Card><CardContent>
              <Button size="sm" variant={isWatching ? 'secondary' : 'outline'} className="w-full mb-2" onClick={() => toggleWatch(isWatching)}>
                {isWatching ? '★ Watching' : '☆ Watch this task'}
              </Button>
              {can('tasks', 'create') && <Button size="sm" variant="outline" className="w-full" onClick={duplicate}>Duplicate</Button>}
            </CardContent></Card>

            {(task.dependencies_from?.length || task.dependencies_to?.length) ? (
              <Card><CardContent>
                <div className="text-[10px] uppercase text-muted-foreground mb-2">Dependencies</div>
                {task.dependencies_from?.map((d) => <div key={d.id} className="text-xs mb-1">Depends on: {d.depends_on.title} ({d.type})</div>)}
                {task.dependencies_to?.map((d) => <div key={d.id} className="text-xs mb-1">Blocks: {d.task.title} ({d.type})</div>)}
              </CardContent></Card>
            ) : null}
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
