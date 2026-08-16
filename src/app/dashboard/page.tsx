'use client';
import Link from 'next/link';
import { RequireAuth } from '@/components/layout/require-auth';
import { useAuth } from '@/hooks/use-auth';
import { useDashboard, useFiles } from '@/hooks/use-resources';
import { useTasks } from '@/hooks/use-tasks';
import { usePermission } from '@/hooks/use-permission';
import { useLocale } from '@/lib/i18n/locale-context';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <Card><CardContent><div className="text-xl font-medium">{value}</div><div className="text-[11px] text-muted-foreground mt-1">{label}</div></CardContent></Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { can } = usePermission();
  const kind = user?.is_system_owner ? 'executive' : user?.role?.name === 'Department Manager' ? 'team' : 'personal';
  const { data, isLoading, isError, refetch } = useDashboard(kind);

  // Managers who can approve get a "pending my review" queue + recent files.
  const canApprove = can('tasks', 'approve');
  const { data: reviewData } = useTasks(canApprove ? { page: 1, page_size: 5, status: 'waiting_approval' } : { page: 1, page_size: 1, status: '__none__' });
  const { data: filesData } = useFiles(canApprove ? { page: 1, page_size: 5 } : { page: 1, page_size: 1 });
  const reviewTasks = canApprove ? (reviewData?.data ?? []) : [];
  const recentFiles = canApprove ? (filesData?.data ?? []) : [];

  // Defensive: the three dashboard shapes differ (personal returns only kpis),
  // and any section may be absent. Coerce everything to safe shapes so a
  // missing/renamed field can never throw a client-side exception.
  const d = (data ?? {}) as Record<string, any>;
  const kpis = (d.kpis ?? {}) as Record<string, any>;
  const departments: any[] = Array.isArray(d.departments) ? d.departments : [];
  const workload: any[] = Array.isArray(d.workload) ? d.workload : [];
  const overdue = d.overdue && typeof d.overdue === 'object' ? d.overdue : null;
  const byPriority: any[] = overdue && Array.isArray(overdue.by_priority) ? overdue.by_priority : [];

  return (
    <RequireAuth>
      <div className="max-w-6xl">
        <h1 className="text-xl font-medium mb-1">{t('nav.dashboard')}</h1>
        <p className="text-xs text-muted-foreground mb-6">{t('dashboard.welcomeBack')}, {user?.full_name}</p>

        {isLoading && <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}</div>}
        {isError && (
          <button onClick={() => refetch()} className="text-xs underline">{t('common.retry')}</button>
        )}

        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Kpi label={t('dashboard.totalTasks')} value={Number(kpis.total ?? 0)} />
              <Kpi label={t('dashboard.active')} value={Number(kpis.active ?? 0)} />
              <Kpi label={t('dashboard.completed')} value={Number(kpis.completed ?? 0)} />
              <Kpi label={t('dashboard.overdue')} value={Number(kpis.overdue ?? 0)} />
            </div>

            {canApprove && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Awaiting my review */}
                <Card>
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium">{t('dashboard.pendingReview')}</span>
                      {reviewTasks.length > 0 && <span className="inline-flex items-center justify-center rounded-full bg-gold/25 text-[#8a6d00] w-5 h-5 text-[11px] font-bold">{reviewTasks.length}</span>}
                    </div>
                    {reviewTasks.length === 0 && <p className="text-[11px] text-muted-foreground">{t('dashboard.noPendingReview')}</p>}
                    <div className="flex flex-col gap-2">
                      {reviewTasks.map((tk: any) => (
                        <Link key={tk.id} href={`/tasks/${tk.id}`} className="flex items-center justify-between text-xs hover:bg-muted rounded px-2 py-1.5 -mx-2">
                          <span className="truncate flex-1">{tk.title}</span>
                          <span className="text-[10px] text-muted-foreground">{tk.assignee?.full_name ?? ''}</span>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent files */}
                <Card>
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium">{t('dashboard.recentFiles')}</span>
                      <Link href="/files" className="text-[11px] text-accent">{t('dashboard.viewAll')}</Link>
                    </div>
                    {recentFiles.length === 0 && <p className="text-[11px] text-muted-foreground">{t('dashboard.noRecentFiles')}</p>}
                    <div className="flex flex-col gap-2">
                      {recentFiles.map((f: any) => (
                        <div key={f.id} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 truncate flex-1">
                            <span>{(f.mime_type || '').startsWith('image/') ? '🖼️' : '📄'}</span>
                            <span className="truncate">{f.file_name}</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground flex-none">{f.uploader?.full_name ?? ''}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {departments.length > 0 && (
              <Card className="mb-4">
                <CardContent>
                  <div className="text-xs font-medium mb-3">{t('dashboard.departmentLoad')}</div>
                  <div className="flex flex-col gap-2">
                    {departments.map((dep: any, i: number) => (
                      <div key={dep?.department_id ?? i}>
                        <div className="flex justify-between text-[11px] mb-1"><span>{dep?.name ?? '—'}</span><span className="text-muted-foreground">{dep?.total_tasks ?? 0}</span></div>
                        <div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(0, Math.min(100, Number(dep?.completion_rate ?? 0)))}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {workload.length > 0 && (
              <Card className="mb-4">
                <CardContent>
                  <div className="text-xs font-medium mb-3">{t('dashboard.teamWorkload')}</div>
                  <div className="flex flex-col gap-2">
                    {workload.map((w: any, i: number) => (
                      <div key={w?.user_id ?? i} className="flex justify-between text-xs"><span>{w?.full_name ?? '—'}</span><span className="font-medium">{w?.active_tasks ?? 0}</span></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {overdue && (
              <Card>
                <CardContent>
                  <div className="text-xs font-medium mb-2">{t('dashboard.overdue')} — {overdue.total_overdue ?? 0}</div>
                  <div className="text-[11px] text-muted-foreground">{t('dashboard.overdueByPriority')}: {byPriority.map((p: any) => `${p?.priority ?? '—'} (${p?.count ?? 0})`).join(', ') || '—'}</div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </RequireAuth>
  );
}
