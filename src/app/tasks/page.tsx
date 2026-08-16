'use client';
import { useState } from 'react';
import Link from 'next/link';
import { RequireAuth } from '@/components/layout/require-auth';
import { useTasks } from '@/hooks/use-tasks';
import { useLocale } from '@/lib/i18n/locale-context';
import { StatusBadge, PriorityBadge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, Pagination } from '@/components/shared/states';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { usePermission } from '@/hooks/use-permission';

export default function TasksPage() {
  const { t } = useLocale();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const { can } = usePermission();
  const { data, isLoading, isError, refetch } = useTasks({ page, page_size: 20, search: search || undefined, status: status || undefined, priority: priority || undefined });

  return (
    <RequireAuth>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-5 gap-2">
          <h1 className="text-xl font-medium">{t('tasks.title')}</h1>
          {can('tasks', 'create') && <Link href="/tasks/new"><Button>{t('tasks.newTask')}</Button></Link>}
        </div>
        <div className="flex gap-2 mb-4 flex-wrap">
          <Input placeholder={t('tasks.searchPlaceholder')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-[220px]" />
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="max-w-[160px]">
            <option value="">{t('tasks.allStatuses')}</option>
            {['draft', 'pending', 'in_progress', 'on_hold', 'waiting_approval', 'completed', 'rejected', 'cancelled', 'archived'].map((s) => <option key={s} value={s}>{t(`common.statusNames.${s}`)}</option>)}
          </Select>
          <Select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} className="max-w-[140px]">
            <option value="">{t('tasks.allPriorities')}</option>
            {['low', 'medium', 'high', 'critical'].map((p) => <option key={p} value={p}>{t(`common.priorityNames.${p}`)}</option>)}
          </Select>
        </div>

        {isLoading && <div className="flex flex-col gap-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-11" />)}</div>}
        {isError && <ErrorState title={t('tasks.couldntLoad')} onRetry={() => refetch()} />}
        {data && data.data.length === 0 && <EmptyState title={t('tasks.noMatch')} />}

        {data && data.data.length > 0 && (
          <div className="rounded-lg border border-input bg-white overflow-hidden">
            {data.data.map((task) => (
              <Link key={task.id} href={`/tasks/${task.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 border-t first:border-t-0 border-input hover:bg-muted text-sm">
                <span className="flex-1 min-w-[140px] truncate">{task.title}</span>
                <span className="hidden sm:inline text-[11px] text-muted-foreground w-24 flex-none">{task.assignee?.full_name ?? '—'}</span>
                <PriorityBadge name={task.priority.name} />
                <StatusBadge name={task.status.name} />
                <span className={`text-[11px] w-16 flex-none ${task.is_overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>{formatDate(task.due_date)}</span>
              </Link>
            ))}
          </div>
        )}
        {data && data.meta.total_pages > 1 && <Pagination page={page} totalPages={data.meta.total_pages} onChange={setPage} />}
      </div>
    </RequireAuth>
  );
}
