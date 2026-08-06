import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1),
    new_password: z.string().min(8, 'At least 8 characters'),
    confirm_password: z.string().min(1),
  })
  .refine((d) => d.new_password === d.confirm_password, { message: 'Passwords do not match', path: ['confirm_password'] });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
