'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Paginated, Task } from '@/lib/schemas/task';

export function useTasks(params: Record<string, unknown>) {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: async () => (await api.get<Paginated<Task>>('/tasks', { params })).data,
  });
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: async () => (await api.get<Task>(`/tasks/${id}`)).data,
    enabled: !!id,
  });
}

export function useTaskHistory(id: string | undefined, page = 1) {
  return useQuery({
    queryKey: ['task-history', id, page],
    queryFn: async () => (await api.get(`/tasks/${id}/history`, { params: { page, page_size: 20 } })).data,
    enabled: !!id,
  });
}

export function useTaskComments(id: string | undefined, page = 1) {
  return useQuery({
    queryKey: ['task-comments', id, page],
    queryFn: async () => (await api.get(`/tasks/${id}/comments`, { params: { page, page_size: 20 } })).data,
    enabled: !!id,
  });
}

export function useTaskChecklists(id: string | undefined) {
  return useQuery({
    queryKey: ['task-checklists', id],
    queryFn: async () => (await api.get(`/tasks/${id}/checklists`)).data,
    enabled: !!id,
  });
}

export function useTaskAttachments(id: string | undefined) {
  return useQuery({
    queryKey: ['task-attachments', id],
    queryFn: async () => (await api.get(`/tasks/${id}/attachments`)).data,
    enabled: !!id,
  });
}
