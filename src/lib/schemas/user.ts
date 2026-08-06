import { z } from 'zod';

export const createUserSchema = z.object({
  full_name: z.string().min(1, 'Name is required').max(120),
  email: z.string().email(),
  department_id: z.string().uuid('Select a department'),
  role_id: z.string().uuid('Select a role'),
  position_id: z.string().uuid().optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const transferUserSchema = z.object({
  to_department_id: z.string().uuid('Select a department'),
  to_position_id: z.string().uuid().optional().or(z.literal('')),
  reason: z.string().max(255).optional(),
});
export type TransferUserInput = z.infer<typeof transferUserSchema>;

export interface UserRow {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  department_id: string;
  position_id?: string | null;
  status: 'active' | 'inactive';
  is_system_owner: boolean;
  created_at: string;
}
