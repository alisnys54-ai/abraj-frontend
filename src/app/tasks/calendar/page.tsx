'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RequireAuth } from '@/components/layout/require-auth';
import { useTasks } from '@/hooks/use-tasks';
import { useLocale } from '@/lib/i18n/locale-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_AR = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export default function CalendarPage() {
  const { t, locale } = useLocale();
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
    for (const task of data?.data ?? []) {
      if (!task.due_date) continue;
      const key = task.due_date.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), task]);
    }
    return map;
  }, [data]);

  const weekdays = locale === 'ar' ? WEEKDAYS_AR : WEEKDAYS_EN;

  return (
    <RequireAuth>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
          <h1 className="text-xl font-medium">{t('nav.calendar')}</h1>
          <div className="flex gap-2 items-center">
            <Button size="sm" variant="secondary" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>{locale === 'ar' ? '→' : '←'}</Button>
            <span className="text-sm font-medium w-32 text-center">{cursor.toLocaleDateString(locale === 'ar' ? 'ar' : undefined, { month: 'long', year: 'numeric' })}</span>
            <Button size="sm" variant="secondary" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>{locale === 'ar' ? '←' : '→'}</Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-[10px] sm:text-[11px] text-muted-foreground font-medium">
          {weekdays.map((d) => <div key={d} className="text-center truncate">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((day, i) => {
            const key = day?.toISOString().slice(0, 10);
            const dayTasks = key ? tasksByDay.get(key) ?? [] : [];
            return (
              <div key={i} className={cn('min-h-16 sm:min-h-24 rounded-md border border-input bg-white p-1 sm:p-1.5', !day && 'bg-transparent border-transparent')}>
                {day && <div className="text-[10px] sm:text-[11px] text-muted-foreground mb-1">{day.getDate()}</div>}
                <div className="flex flex-col gap-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div key={task.id} onClick={() => router.push(`/tasks/${task.id}`)} className={cn('truncate rounded px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] cursor-pointer', task.is_overdue ? 'bg-destructive/15 text-destructive' : 'bg-accent/15 text-accent')}>
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && <div className="text-[9px] sm:text-[10px] text-muted-foreground">+{dayTasks.length - 3}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </RequireAuth>
  );
}
