'use client';
import { useState } from 'react';
import Link from 'next/link';
import { RequireAuth } from '@/components/layout/require-auth';
import { useTasks } from '@/hooks/use-tasks';
import { StatusBadge, PriorityBadge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, Pagination } from '@/components/shared/states';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { usePermission } from '@/hooks/use-permission';

export default function TasksPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const { can } = usePermission();
  const { data, isLoading, isError, refetch } = useTasks({ page, page_size: 20, search: search || undefined, status: status || undefined, priority: priority || undefined });

  return (
    <RequireAuth>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-medium">Tasks</h1>
          {can('tasks', 'create') && <Link href="/tasks/new"><Button>New Task</Button></Link>}
        </div>
        <div className="flex gap-2 mb-4 flex-wrap">
          <Input placeholder="Search…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-[220px]" />
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="max-w-[160px]">
            <option value="">All statuses</option>
            {['draft', 'pending', 'in_progress', 'on_hold', 'waiting_approval', 'completed', 'rejected', 'cancelled', 'archived'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} className="max-w-[140px]">
            <option value="">All priorities</option>
            {['low', 'medium', 'high', 'critical'].map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </div>

        {isLoading && <div className="flex flex-col gap-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-11" />)}</div>}
        {isError && <ErrorState title="Couldn't load tasks" onRetry={() => refetch()} />}
        {data && data.data.length === 0 && <EmptyState title="No tasks match your filters" />}

        {data && data.data.length > 0 && (
          <div className="rounded-lg border border-input bg-white overflow-hidden">
            {data.data.map((t) => (
              <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center gap-3 px-4 py-3 border-t first:border-t-0 border-input hover:bg-muted text-sm">
                <span className="flex-1 min-w-0 truncate">{t.title}</span>
                <span className="text-[11px] text-muted-foreground w-24 flex-none">{t.assignee?.full_name ?? '—'}</span>
                <PriorityBadge name={t.priority.name} />
                <StatusBadge name={t.status.name} />
                <span className={`text-[11px] w-16 flex-none ${t.is_overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>{formatDate(t.due_date)}</span>
              </Link>
            ))}
          </div>
        )}
        {data && data.meta.total_pages > 1 && <Pagination page={page} totalPages={data.meta.total_pages} onChange={setPage} />}
      </div>
    </RequireAuth>
  );
}
