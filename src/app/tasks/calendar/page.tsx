'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RequireAuth } from '@/components/layout/require-auth';
import { useTasks } from '@/hooks/use-tasks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function CalendarPage() {
  const router = useRouter();
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const { data } = useTasks({ page: 1, page_size: 300 });

  const days = useMemo(() => {
    const year = cursor.getFullYear(), month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [...Array(startOffset).fill(null), ...Array(daysInMonth).fill(0).map((_, i) => new Date(year, month, i + 1))];
    return cells;
  }, [cursor]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const t of data?.data ?? []) {
      if (!t.due_date) continue;
      const key = t.due_date.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), t]);
    }
    return map;
  }, [data]);

  return (
    <RequireAuth>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-medium">Calendar</h1>
          <div className="flex gap-2 items-center">
            <Button size="sm" variant="secondary" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>←</Button>
            <span className="text-sm font-medium w-32 text-center">{cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
            <Button size="sm" variant="secondary" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>→</Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 mb-2 text-[11px] text-muted-foreground font-medium">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="text-center">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, i) => {
            const key = day?.toISOString().slice(0, 10);
            const dayTasks = key ? tasksByDay.get(key) ?? [] : [];
            return (
              <div key={i} className={cn('min-h-24 rounded-md border border-input bg-white p-1.5', !day && 'bg-transparent border-transparent')}>
                {day && <div className="text-[11px] text-muted-foreground mb-1">{day.getDate()}</div>}
                <div className="flex flex-col gap-1">
                  {dayTasks.slice(0, 3).map((t) => (
                    <div key={t.id} onClick={() => router.push(`/tasks/${t.id}`)} className={cn('truncate rounded px-1.5 py-0.5 text-[10px] cursor-pointer', t.is_overdue ? 'bg-destructive/15 text-destructive' : 'bg-accent/15 text-accent')}>
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && <div className="text-[10px] text-muted-foreground">+{dayTasks.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </RequireAuth>
  );
}
