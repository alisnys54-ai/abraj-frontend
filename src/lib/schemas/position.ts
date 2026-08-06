import { z } from 'zod';

export const createPositionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  department_id: z.string().uuid().optional().or(z.literal('')),
});
export type CreatePositionInput = z.infer<typeof createPositionSchema>;

export interface PositionRow {
  id: string;
  title: string;
  department_id: string | null;
  is_archived: boolean;
  created_at: string;
}
