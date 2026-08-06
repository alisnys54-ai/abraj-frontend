'use client';
import { useState } from 'react';
import { RequireAuth } from '@/components/layout/require-auth';
import { useActivityLog, useUsers } from '@/hooks/use-resources';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, Pagination } from '@/components/shared/states';
import { formatDate } from '@/lib/utils';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState('');
  const { data: users } = useUsers({ page: 1, page_size: 200 });
  const { data, isLoading } = useActivityLog({ page, page_size: 30, search: search || undefined, user_id: userId || undefined });

  return (
    <RequireAuth>
      <div className="max-w-4xl">
        <h1 className="text-xl font-medium mb-5">Audit Logs</h1>
        <div className="flex gap-2 mb-4">
          <Input placeholder="Search action…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-[220px]" />
          <Select value={userId} onChange={(e) => { setUserId(e.target.value); setPage(1); }} className="max-w-[200px]">
            <option value="">All users</option>
            {users?.data.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </Select>
        </div>
        {isLoading && <Skeleton className="h-64" />}
        {data && data.data?.length === 0 && <EmptyState title="No activity found" />}
        {data && data.data?.length > 0 && (
          <div className="rounded-lg border border-input bg-white overflow-hidden">
            {data.data.map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3 border-t first:border-t-0 border-input text-sm">
                <span className="flex-1 capitalize">{a.action.replace(/_/g, ' ')}{a.field_name ? ` — ${a.field_name}` : ''}</span>
                <span className="text-[11px] text-muted-foreground w-32 truncate">{a.actor?.full_name ?? 'System'}</span>
                <span className="text-[11px] text-muted-foreground w-32">{formatDate(a.created_at)}</span>
              </div>
            ))}
          </div>
        )}
        {data?.meta && data.meta.total_pages > 1 && <Pagination page={page} totalPages={data.meta.total_pages} onChange={setPage} />}
      </div>
    </RequireAuth>
  );
}
