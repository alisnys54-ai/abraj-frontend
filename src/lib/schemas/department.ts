import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(80),
  parent_department_id: z.string().uuid().optional().or(z.literal('')),
});
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

export interface DepartmentNode {
  id: string;
  name: string;
  is_active: boolean;
  employee_count: number;
  position_count: number;
  managers: { user_id: string; full_name: string }[];
  children: DepartmentNode[];
}

export interface DepartmentRow {
  id: string;
  name: string;
  parent_department_id: string | null;
  is_active: boolean;
  created_at: string;
}
