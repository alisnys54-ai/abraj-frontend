import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  department_id: z.string().uuid('Select a department'),
  project_id: z.string().uuid().optional().or(z.literal('')),
  assignee_id: z.string().uuid().optional().or(z.literal('')),
  reviewer_id: z.string().uuid().optional().or(z.literal('')),
  priority_id: z.string().uuid('Select a priority'),
  start_date: z.string().optional().or(z.literal('')),
  due_date: z.string().optional().or(z.literal('')),
  reminder_date: z.string().optional().or(z.literal('')),
  requires_review: z.boolean().optional(),
  parent_task_id: z.string().uuid().optional().or(z.literal('')),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial().omit({ department_id: true }).extend({
  department_id: z.string().uuid().optional(),
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const changeStatusSchema = z.object({
  to_status_id: z.string().uuid(),
  reason: z.string().max(255).optional(),
});
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;

export interface Task {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  status: { id: string; name: string };
  priority: { id: string; name: string };
  department_id?: string;
  department?: { id: string; name: string };
  project?: { id: string; name: string } | null;
  creator?: { id: string; full_name: string };
  assignee: { id: string; full_name: string } | null;
  reviewer?: { id: string; full_name: string } | null;
  parent_task?: { id: string; code: string; title: string } | null;
  additional_assignees?: { user_id: string; full_name: string }[];
  watchers?: { user_id: string; full_name: string }[];
  dependencies_from?: { id: string; type: string; depends_on: { id: string; code: string; title: string } }[];
  dependencies_to?: { id: string; type: string; task: { id: string; code: string; title: string } }[];
  is_blocked?: boolean;
  blocking_task_ids?: string[];
  blocking_reasons?: string[];
  start_date?: string | null;
  due_date: string | null;
  reminder_date?: string | null;
  is_overdue: boolean;
  requires_review?: boolean;
  tags?: string[];
  subtask_count?: number;
  comment_count: number;
  attachment_count: number;
  checklist_count: number;
  created_at: string;
  updated_at?: string;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; page_size: number; total: number; total_pages: number };
}
