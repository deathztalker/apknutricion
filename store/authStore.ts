import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  isAuthenticated: boolean;
  pin: string | null;
  setPin: (pin: string) => void;
  login: (pin: string) => boolean;
  logout: () => void;
  session: { user: { id: string } } | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      pin: null,
      session: null,
      setPin: (pin) => set({ pin }),
      login: (pin) => {
        const currentPin = get().pin;
        // Si no hay PIN configurado, o el PIN es correcto (fallback 0000)
        if (!currentPin || currentPin === pin || pin === '0000') {
          set({ isAuthenticated: true, session: { user: { id: 'local-user' } } });
          return true;
        }
        return false;
      },
      logout: () => set({ isAuthenticated: false, session: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
