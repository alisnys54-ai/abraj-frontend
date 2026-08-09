'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { RequireAuth } from '@/components/layout/require-auth';
import { useNotifications } from '@/hooks/use-resources';
import { useLocale } from '@/lib/i18n/locale-context';
import { getNotificationsSocket } from '@/lib/socket';
import { api, apiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/states';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const { t } = useLocale();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { data, isLoading } = useNotifications({ page: 1, page_size: 50, is_read: filter === 'unread' ? false : undefined });
  const qc = useQueryClient();
  const { push } = useToast();
  const router = useRouter();

  useEffect(() => {
    const socket = getNotificationsSocket();
    if (!socket) return;
    const handler = () => qc.invalidateQueries({ queryKey: ['notifications'] });
    socket.on('notification', handler);
    return () => { socket.off('notification', handler); };
  }, [qc]);

  const markRead = async (id: string, is_read: boolean) => {
    try { await api.patch(`/notifications/${id}/read`, { is_read }); qc.invalidateQueries({ queryKey: ['notifications'] }); } catch (e) { push(apiErrorMessage(e), 'error'); }
  };
  const markAllRead = async () => {
    try { await api.post('/notifications/mark-all-read'); qc.invalidateQueries({ queryKey: ['notifications'] }); } catch (e) { push(apiErrorMessage(e), 'error'); }
  };
  const remove = async (id: string) => {
    try { await api.delete(`/notifications/${id}`); qc.invalidateQueries({ queryKey: ['notifications'] }); } catch (e) { push(apiErrorMessage(e), 'error'); }
  };

  return (
    <RequireAuth>
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
          <h1 className="text-xl font-medium">{t('notifications.title')}</h1>
          <Button size="sm" variant="secondary" onClick={markAllRead}>{t('notifications.markAllRead')}</Button>
        </div>
        <div className="text-xs text-muted-foreground mb-4">{data?.unread_count ?? 0} {t('notifications.unread')}</div>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setFilter('all')} className={cn('text-xs font-medium rounded-md border border-input px-3 py-1.5', filter === 'all' && 'bg-primary text-white border-primary')}>{t('notifications.all')}</button>
          <button onClick={() => setFilter('unread')} className={cn('text-xs font-medium rounded-md border border-input px-3 py-1.5', filter === 'unread' && 'bg-primary text-white border-primary')}>{t('notifications.unreadFilter')}</button>
        </div>
        {isLoading && <Skeleton className="h-48" />}
        {data && data.data.length === 0 && <EmptyState title={t('notifications.noNotifications')} />}
        {data && data.data.length > 0 && (
          <div className="rounded-lg border border-input bg-white overflow-hidden">
            {data.data.map((n: any) => (
              <div key={n.id} className={cn('flex flex-wrap items-start gap-3 px-4 py-3 border-t first:border-t-0 border-input text-sm', !n.is_read && 'bg-accent/5')}>
                <span className={cn('h-1.5 w-1.5 rounded-full mt-1.5 flex-none', n.is_read ? 'bg-transparent' : 'bg-accent')} />
                <div className="flex-1 min-w-[140px] cursor-pointer" onClick={() => { if (n.task_id) router.push(`/tasks/${n.task_id}`); markRead(n.id, true); }}>
                  <div>{n.message}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{formatDate(n.created_at)}</div>
                </div>
                <button onClick={() => markRead(n.id, !n.is_read)} className="text-[11px] text-accent flex-none">{n.is_read ? t('notifications.markUnread') : t('notifications.markRead')}</button>
                <button onClick={() => remove(n.id)} className="text-[11px] text-destructive flex-none">{t('notifications.delete')}</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
