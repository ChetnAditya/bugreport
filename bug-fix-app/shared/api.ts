// Source of truth for ALL API endpoints consumed by the client.
// If the server changes a path/method/response shape, update here first.

const BASE = '/api';

export const Api = {
  auth: {
    register: `${BASE}/auth/register`,
    login: `${BASE}/auth/login`,
    logout: `${BASE}/auth/logout`,
    me: `${BASE}/auth/me`,
  },
  users: {
    list: `${BASE}/users`,
    byId: (id: string) => `${BASE}/users/${id}`,
    changeRole: (id: string) => `${BASE}/users/${id}/role`,
  },
  bugs: {
    list: `${BASE}/bugs`,
    byId: (id: string) => `${BASE}/bugs/${id}`,
    transition: (id: string) => `${BASE}/bugs/${id}/transition`,
    screenshotsSign: (id: string) => `${BASE}/bugs/${id}/screenshots/sign`,
    screenshots: (id: string) => `${BASE}/bugs/${id}/screenshots`,
    comments: (id: string) => `${BASE}/bugs/${id}/comments`,
  },
  comments: {
    byId: (id: string) => `${BASE}/comments/${id}`,
  },
  stats: {
    summary: `${BASE}/stats/summary`,
    developers: `${BASE}/stats/developers`,
  },
} as const;
