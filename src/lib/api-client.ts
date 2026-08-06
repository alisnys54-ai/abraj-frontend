import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { tokenStore } from './token-store';

export const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1' });

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Mirrors the backend's rotating-refresh-token scheme exactly: on a 401, spend
// the current refresh token once for a new access+refresh pair, retry the
// original request, and queue any other requests that 401'd in the same
// window so a burst of parallel calls doesn't burn multiple refresh tokens.
let refreshing: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refresh_token = tokenStore.getRefresh();
  if (!refresh_token) throw new Error('No refresh token available');
  const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refresh_token });
  tokenStore.set(res.data.access_token, res.data.refresh_token);
  return res.data.access_token;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retried && !original.url?.includes('/auth/')) {
      original._retried = true;
      try {
        refreshing = refreshing ?? refreshAccessToken();
        const newToken = await refreshing;
        refreshing = null;
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        tokenStore.clear();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  },
);

export interface ApiErrorShape {
  error: { code: string; message: string; correlationId: string; details?: unknown };
}

export function apiErrorMessage(e: unknown): string {
  const err = e as AxiosError<ApiErrorShape>;
  return err.response?.data?.error?.message ?? err.message ?? 'Something went wrong';
}
