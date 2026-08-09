'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { RequireAuth } from '@/components/layout/require-auth';
import { useTasks } from '@/hooks/use-tasks';
import { useTaskStatuses } from '@/hooks/use-resources';
import { api, apiErrorMessage } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import { useLocale } from '@/lib/i18n/locale-context';
import { PriorityBadge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function KanbanPage() {
  const { t } = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const { push } = useToast();
  const { data: statuses } = useTaskStatuses();
  const { data, isLoading } = useTasks({ page: 1, page_size: 200 });
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);

  const onDrop = async (toStatusId: string) => {
    if (!dragTaskId) return;
    try {
      await api.post(`/tasks/${dragTaskId}/status`, { to_status_id: toStatusId });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      push(t('tasks.statusUpdated'));
    } catch (e) {
      push(apiErrorMessage(e), 'error');
    }
    setDragTaskId(null);
  };

  return (
    <RequireAuth>
      <div className="max-w-full">
        <h1 className="text-xl font-medium mb-5">{t('nav.kanban')}</h1>
        {isLoading && <Skeleton className="h-64" />}
        {statuses && data && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {statuses.map((s) => {
              const col = data.data.filter((t) => t.status.name === s.name);
              return (
                <div
                  key={s.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(s.id)}
                  className="w-64 flex-none rounded-lg bg-muted/60 p-2"
                >
                  <div className="text-xs font-medium px-2 py-1.5 flex justify-between">
                    <span className="capitalize">{s.name.replace(/_/g, ' ')}</span><span className="text-muted-foreground">{col.length}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {col.map((t) => (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={() => setDragTaskId(t.id)}
                        onClick={() => router.push(`/tasks/${t.id}`)}
                        className="rounded-md bg-white border border-input p-3 text-xs cursor-pointer shadow-sm"
                      >
                        <div className="mb-1.5 font-medium">{t.title}</div>
                        <div className="flex items-center justify-between">
                          <PriorityBadge name={t.priority.name} />
                          {t.assignee && <span className="text-[10px] text-muted-foreground">{t.assignee.full_name}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
