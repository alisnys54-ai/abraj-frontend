/** Single place tokens are read/written — swap this for httpOnly-cookie storage later without touching call sites. */
const ACCESS_KEY = 'aay_access_token';
const REFRESH_KEY = 'aay_refresh_token';

export const tokenStore = {
  getAccess: () => (typeof window === 'undefined' ? null : localStorage.getItem(ACCESS_KEY)),
  getRefresh: () => (typeof window === 'undefined' ? null : localStorage.getItem(REFRESH_KEY)),
  set: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
