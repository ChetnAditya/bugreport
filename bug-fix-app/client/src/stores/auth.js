import { create } from 'zustand';
export const useAuthStore = create((set) => ({
    user: null,
    status: 'unknown',
    setUser: (u) => set({ user: u, status: u ? 'authed' : 'guest' }),
}));
