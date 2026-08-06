'use client';
import { useState } from 'react';
import { RequireAuth } from '@/components/layout/require-auth';
import { api, apiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { rowsToCsv, downloadCsv } from '@/lib/csv';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

const REPORTS = [
  { key: 'tasks_by_department', label: 'Tasks by Department' },
  { key: 'tasks_by_employee', label: 'Tasks by Employee' },
  { key: 'completed_vs_overdue', label: 'Completed vs Overdue' },
  { key: 'productivity', label: 'Productivity' },
] as const;

export default function ReportsPage() {
  const { push } = useToast();
  const [rows, setRows] = useState<Record<string, Record<string, unknown>[]>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const load = async (report: string) => {
    setLoading(report);
    try {
      const res = await api.post('/reports/export', { format: 'csv', report, filters: {} });
      const data = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
      setRows((prev) => ({ ...prev, [report]: data }));
    } catch (e) {
      push(apiErrorMessage(e), 'error');
    } finally {
      setLoading(null);
    }
  };

  const exportCsv = (report: string) => {
    const data = rows[report];
    if (!data?.length) return;
    downloadCsv(`${report}.csv`, rowsToCsv(data));
  };

  return (
    <RequireAuth>
      <div className="max-w-4xl">
        <h1 className="text-xl font-medium mb-1">Reports</h1>
        <p className="text-xs text-muted-foreground mb-5">Every export request is recorded in the Activity Log. PDF/Excel file generation is not yet wired server-side — CSV is generated client-side from the same real, scoped data.</p>
        <Tabs defaultValue={REPORTS[0].key}>
          <TabsList>{REPORTS.map((r) => <TabsTrigger key={r.key} value={r.key} onClick={() => load(r.key)}>{r.label}</TabsTrigger>)}</TabsList>
          {REPORTS.map((r) => (
            <TabsContent key={r.key} value={r.key}>
              <Card className="mt-4"><CardContent>
                <div className="flex justify-between items-center mb-3">
                  <Button size="sm" variant="secondary" onClick={() => load(r.key)} disabled={loading === r.key}>{loading === r.key ? 'Loading…' : 'Refresh'}</Button>
                  <Button size="sm" onClick={() => exportCsv(r.key)} disabled={!rows[r.key]?.length}>Export CSV</Button>
                </div>
                {!rows[r.key] && <p className="text-xs text-muted-foreground">Click Refresh to load this report.</p>}
                {rows[r.key] && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr>{Object.keys(rows[r.key][0] ?? {}).map((h) => <th key={h} className="text-left font-medium text-muted-foreground pb-2 pe-4">{h}</th>)}</tr></thead>
                      <tbody>
                        {rows[r.key].map((row, i) => (
                          <tr key={i} className="border-t border-input">
                            {Object.keys(rows[r.key][0] ?? {}).map((h) => <td key={h} className="py-1.5 pe-4">{String((row as any)[h] ?? '—')}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent></Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </RequireAuth>
  );
}
