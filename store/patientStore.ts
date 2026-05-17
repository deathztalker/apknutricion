import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Patient, ClinicalRecord } from '@/types';

interface PatientState {
  patients: Patient[];
  selectedPatient: Patient | null;
  selectedRecord: ClinicalRecord | null;
  setPatients: (p: Patient[]) => void;
  setSelectedPatient: (p: Patient | null) => void;
  setSelectedRecord: (r: ClinicalRecord | null) => void;
  addPatient: (p: Patient) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  removePatient: (id: string) => void;
}

export const usePatientStore = create<PatientState>()(
  persist(
    (set) => ({
      patients: [],
      selectedPatient: null,
      selectedRecord: null,
      setPatients: (patients) => set({ patients }),
      setSelectedPatient: (p) => set({ selectedPatient: p }),
      setSelectedRecord: (r) => set({ selectedRecord: r }),
      addPatient: (p) => set(state => ({ patients: [p, ...state.patients] })),
      updatePatient: (id, updates) => set(state => ({
        patients: state.patients.map(p => p.id === id ? { ...p, ...updates } : p),
      })),
      removePatient: (id) => set(state => ({
        patients: state.patients.filter(p => p.id !== id),
      })),
    }),
    {
      name: 'patient-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
