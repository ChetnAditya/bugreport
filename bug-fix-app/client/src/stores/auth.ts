import { create } from 'zustand';
import type { User } from '@/types/domain';

interface AuthState {
  user: User | null;
  status: 'unknown' | 'authed' | 'guest';
  setUser: (u: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'unknown',
  setUser: (u) => set({ user: u, status: u ? 'authed' : 'guest' }),
}));
