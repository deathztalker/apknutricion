import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  groqApiKey: string | null;
  groqModel: string;
  setGroqApiKey: (key: string | null) => void;
  setGroqModel: (model: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      groqApiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || null,
      groqModel: 'llama-3.1-70b-versatile',
      setGroqApiKey: (key) => set({ groqApiKey: key }),
      setGroqModel: (model) => set({ groqModel: model }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
