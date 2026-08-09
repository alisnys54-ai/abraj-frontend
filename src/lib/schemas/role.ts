import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(60),
  description: z.string().max(255).optional().or(z.literal('')),
  clone_from_role_id: z.string().uuid().optional().or(z.literal('')),
});
export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export interface RoleRow {
  id: string;
  name: string;
  description?: string | null;
  isSystemRole: boolean;
  createdAt: string;
}

export interface PermissionCatalogEntry {
  id: string;
  module: string;
  action: string;
}

export interface RolePermissionEntry {
  permission: { module: string; action: string };
  scope: 'all' | 'department' | 'own';
  granted: boolean;
}

export const PERMISSION_MODULES = [
  'users', 'roles', 'permissions', 'departments', 'positions', 'tasks', 'task-comments',
  'task-checklists', 'attachments', 'notifications', 'activity-logs', 'reports',
  'settings', 'sessions',
];
export const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete', 'approve', 'assign', 'export', 'manage', 'upload', 'comment'];
