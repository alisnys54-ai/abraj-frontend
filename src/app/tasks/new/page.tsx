'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { RequireAuth } from '@/components/layout/require-auth';
import { createTaskSchema, type CreateTaskInput } from '@/lib/schemas/task';
import { api, apiErrorMessage } from '@/lib/api-client';
import { useDepartments, useUsers, useTaskPriorities } from '@/hooks/use-resources';
import { useLocale } from '@/lib/i18n/locale-context';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function NewTaskPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const { data: depts } = useDepartments({ page: 1, page_size: 100 });
  const { data: users } = useUsers({ page: 1, page_size: 200 });
  const { data: priorities } = useTaskPriorities();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateTaskInput>({ resolver: zodResolver(createTaskSchema) });

  const onSubmit = async (values: CreateTaskInput) => {
    setServerError(null);
    try {
      const payload = {
        ...values,
        project_id: values.project_id || undefined,
        assignee_id: values.assignee_id || undefined,
        reviewer_id: values.reviewer_id || undefined,
        start_date: values.start_date || undefined,
        due_date: values.due_date || undefined,
        reminder_date: values.reminder_date || undefined,
        parent_task_id: values.parent_task_id || undefined,
      };
      const res = await api.post('/tasks', payload);
      router.push(`/tasks/${res.data.id}`);
    } catch (e) {
      setServerError(apiErrorMessage(e));
    }
  };

  return (
    <RequireAuth>
      <div className="max-w-2xl">
        <h1 className="text-xl font-medium mb-5">{t('tasks.createTask')}</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 bg-white border border-input rounded-lg p-5">
          <div>
            <Label>{t('tasks.titleField')}</Label>
            <Input {...register('title')} />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <Label>{t('tasks.description')}</Label>
            <Textarea {...register('description')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t('tasks.departmentField')}</Label>
              <Select {...register('department_id')}>
                <option value="">{t('common.selectPlaceholder')}</option>
                {depts?.data.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
              {errors.department_id && <p className="text-xs text-destructive mt-1">{errors.department_id.message}</p>}
            </div>
            <div>
              <Label>{t('tasks.assignee')}</Label>
              <Select {...register('assignee_id')}>
                <option value="">{t('tasks.unassigned')}</option>
                {users?.data.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>{t('tasks.priorityField')}</Label>
              <Select {...register('priority_id')}>
                <option value="">{t('common.selectPlaceholder')}</option>
                {priorities?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
              {errors.priority_id && <p className="text-xs text-destructive mt-1">{errors.priority_id.message}</p>}
            </div>
            <div><Label>{t('tasks.startDate')}</Label><Input type="date" {...register('start_date')} /></div>
            <div><Label>{t('tasks.dueDate')}</Label><Input type="date" {...register('due_date')} /></div>
          </div>
          <div>
            <Label>{t('tasks.reviewer')}</Label>
            <Select {...register('reviewer_id')}>
              <option value="">{t('tasks.none')}</option>
              {users?.data.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </Select>
          </div>
          {serverError && <p className="text-xs text-destructive">{serverError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => router.back()}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? t('tasks.creating') : t('tasks.createTask')}</Button>
          </div>
        </form>
      </div>
    </RequireAuth>
  );
}
