import { create } from 'zustand';

interface AuthState {
  session: any;
  profile: any;
  setSession: (session: any) => void;
  setProfile: (profile: any) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  session: { user: { id: 'local-user' } },
  profile: { full_name: 'Nutricionista', role: 'admin' },
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  isAuthenticated: () => true,
}));
