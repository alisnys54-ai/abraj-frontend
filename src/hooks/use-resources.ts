'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { DepartmentNode, DepartmentRow } from '@/lib/schemas/department';
import type { Paginated } from '@/lib/schemas/task';
import type { PositionRow } from '@/lib/schemas/position';
import type { UserRow } from '@/lib/schemas/user';

export function useDepartmentTree() {
  return useQuery({ queryKey: ['departments-tree'], queryFn: async () => (await api.get<DepartmentNode[]>('/departments/tree')).data });
}
export function useDepartments(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['departments', params], queryFn: async () => (await api.get<Paginated<DepartmentRow>>('/departments', { params })).data });
}
export function usePositions(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['positions', params], queryFn: async () => (await api.get<Paginated<PositionRow>>('/positions', { params })).data });
}
export function useUsers(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['users', params], queryFn: async () => (await api.get<Paginated<UserRow>>('/users', { params })).data });
}
export function useRoles() {
  return useQuery({ queryKey: ['roles'], queryFn: async () => (await api.get('/roles')).data });
}
export function useNotifications(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['notifications', params], queryFn: async () => (await api.get('/notifications', { params })).data, refetchInterval: 20_000 });
}
export function useActivityLog(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['activity-log', params], queryFn: async () => (await api.get('/activity-logs', { params })).data });
}
export function useDashboard(kind: 'executive' | 'team' | 'personal', params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['dashboard', kind, params], queryFn: async () => (await api.get(`/dashboard/${kind}`, { params })).data });
}
export function useCompanySettings() {
  return useQuery({ queryKey: ['settings'], queryFn: async () => (await api.get('/settings/company')).data });
}
export function useTaskStatuses() {
  return useQuery({
    queryKey: ['task-statuses'],
    queryFn: async () => (await api.get<{ id: string; name: string; sort_order: number }[]>('/task-statuses')).data,
    staleTime: Infinity,
  });
}
export function useTaskPriorities() {
  return useQuery({
    queryKey: ['task-priorities'],
    queryFn: async () => (await api.get<{ id: string; name: string; sort_order: number }[]>('/task-priorities')).data,
    staleTime: Infinity,
  });
}
