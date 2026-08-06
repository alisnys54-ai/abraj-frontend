'use client';
import { RequireAuth } from '@/components/layout/require-auth';
import { useAuth } from '@/hooks/use-auth';
import { useDashboard } from '@/hooks/use-resources';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <Card><CardContent><div className="text-xl font-medium">{value}</div><div className="text-[11px] text-muted-foreground mt-1">{label}</div></CardContent></Card>
  );
}

function DashboardBody() {
  const { isSystemOwner, roleName } = { isSystemOwner: false, roleName: '' }; // placeholder overwritten below
  return null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const kind = user?.is_system_owner ? 'executive' : user?.role?.name === 'Department Manager' ? 'team' : 'personal';
  const { data, isLoading, isError, refetch } = useDashboard(kind);

  return (
    <RequireAuth>
      <div className="max-w-6xl">
        <h1 className="text-xl font-medium mb-1">Dashboard</h1>
        <p className="text-xs text-muted-foreground mb-6">Welcome back, {user?.full_name}</p>

        {isLoading && <div className="grid grid-cols-4 gap-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}</div>}
        {isError && <button onClick={() => refetch()} className="text-xs underline">Retry</button>}

        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Kpi label="Total Tasks" value={data.kpis?.total ?? 0} />
              <Kpi label="Active" value={data.kpis?.active ?? 0} />
              <Kpi label="Completed" value={data.kpis?.completed ?? 0} />
              <Kpi label="Overdue" value={data.kpis?.overdue ?? 0} />
            </div>

            {data.departments && (
              <Card className="mb-4">
                <CardContent>
                  <div className="text-xs font-medium mb-3">Department Load</div>
                  <div className="flex flex-col gap-2">
                    {data.departments.map((d: any) => (
                      <div key={d.department_id}>
                        <div className="flex justify-between text-[11px] mb-1"><span>{d.name}</span><span className="text-muted-foreground">{d.total_tasks}</span></div>
                        <div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-accent" style={{ width: `${d.completion_rate}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {data.workload && (
              <Card className="mb-4">
                <CardContent>
                  <div className="text-xs font-medium mb-3">Team Workload</div>
                  <div className="flex flex-col gap-2">
                    {data.workload.map((w: any) => (
                      <div key={w.user_id} className="flex justify-between text-xs"><span>{w.full_name}</span><span className="font-medium">{w.active_tasks}</span></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {data.overdue && (
              <Card>
                <CardContent>
                  <div className="text-xs font-medium mb-2">Overdue — {data.overdue.total_overdue}</div>
                  <div className="text-[11px] text-muted-foreground">By priority: {data.overdue.by_priority?.map((p: any) => `${p.priority} (${p.count})`).join(', ') || '—'}</div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </RequireAuth>
  );
}
