'use client';
import { useState } from 'react';
import Link from 'next/link';
import { RequireAuth } from '@/components/layout/require-auth';
import { useFiles, useUsers } from '@/hooks/use-resources';
import { useAuth } from '@/hooks/use-auth';
import { usePermission } from '@/hooks/use-permission';
import { useQueryClient } from '@tanstack/react-query';
import { api, apiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { useLocale } from '@/lib/i18n/locale-context';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, Pagination } from '@/components/shared/states';
import { formatDate } from '@/lib/utils';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function FilesPage() {
  const { t } = useLocale();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState('');
  const { data: users } = useUsers({ page: 1, page_size: 200 });
  const { data, isLoading } = useFiles({ page, page_size: 30, search: search || undefined, user_id: userId || undefined });
  const { user } = useAuth();
  const { can } = usePermission();
  const { push } = useToast();
  const qc = useQueryClient();

  const deleteFile = async (fileId: string) => {
    if (!confirm(t('files.deleteConfirm'))) return;
    try {
      await api.delete(`/attachments/${fileId}`);
      qc.invalidateQueries({ queryKey: ['files'] });
      push(t('files.fileDeleted'));
    } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  return (
    <RequireAuth>
      <div className="max-w-5xl">
        <h1 className="text-xl font-medium mb-1">{t('files.title')}</h1>
        <p className="text-xs text-muted-foreground mb-5">{t('files.subtitle')}</p>

        <div className="flex gap-2 mb-4 flex-wrap">
          <Input placeholder={t('files.searchPlaceholder')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-[220px]" />
          <Select value={userId} onChange={(e) => { setUserId(e.target.value); setPage(1); }} className="max-w-[200px]">
            <option value="">{t('files.allUsers')}</option>
            {users?.data.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </Select>
        </div>

        {isLoading && <Skeleton className="h-64" />}
        {data && data.data?.length === 0 && <EmptyState title={t('files.noFiles')} />}

        {data && data.data?.length > 0 && (
          <div className="rounded-lg border border-input bg-white overflow-hidden">
            {/* header row (desktop) */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-muted/50 text-[11px] font-medium text-muted-foreground">
              <span className="flex-1">{t('files.title')}</span>
              <span className="w-40">{t('files.uploadedBy')}</span>
              <span className="w-48">{t('files.task')}</span>
              <span className="w-32">{t('files.date')}</span>
              <span className="w-16" />
            </div>
            {data.data.map((f: any) => {
              const isImg = (f.mime_type || '').startsWith('image/');
              const fileUrl = `${API}/attachments/${f.id}/file`;
              return (
                <div key={f.id} className="flex flex-wrap md:flex-nowrap items-center gap-3 px-4 py-3 border-t first:border-t-0 border-input text-sm">
                  <span className="flex items-center gap-2 flex-1 min-w-[160px]">
                    <span>{isImg ? '🖼️' : '📄'}</span>
                    <span className="truncate">{f.file_name}</span>
                  </span>
                  <span className="w-40 text-xs text-muted-foreground truncate">{f.uploader?.full_name ?? '—'}</span>
                  <span className="w-48 text-xs truncate">
                    {f.task ? <Link href={`/tasks/${f.task.id}`} className="text-accent">{f.task.title}</Link> : '—'}
                  </span>
                  <span className="w-32 text-[11px] text-muted-foreground">{formatDate(f.created_at)}</span>
                  <span className="flex items-center gap-3">
                    <a href={fileUrl} target="_blank" rel="noreferrer" className="text-[11px] text-accent">{t('files.view')}</a>
                    <a href={`${fileUrl}?download=1`} className="text-[11px] text-accent font-medium">⬇ {t('files.download')}</a>
                    {(f.uploader?.id === user?.id || can('attachments', 'delete')) && (
                      <button onClick={() => deleteFile(f.id)} className="text-[11px] text-destructive">{t('files.delete')}</button>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {data?.meta && data.meta.total_pages > 1 && <Pagination page={page} totalPages={data.meta.total_pages} onChange={setPage} />}
      </div>
    </RequireAuth>
  );
}
