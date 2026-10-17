// lib/supabase.ts (Local Mock)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePatientStore } from '../store/patientStore';

// Mock Supabase Client
const mockChain: any = {
  select: (...args: any[]) => mockChain,
  eq: (...args: any[]) => mockChain,
  order: (...args: any[]) => mockChain,
  limit: (...args: any[]) => mockChain,
  single: async (...args: any[]) => ({ data: { id: 'mock-id', patient_id: 'mock-patient-id' }, error: null }),
  insert: (...args: any[]) => mockChain,
  update: (...args: any[]) => mockChain,
  delete: (...args: any[]) => mockChain,
  upsert: (...args: any[]) => mockChain,
  not: (...args: any[]) => mockChain,
  ilike: (...args: any[]) => mockChain,
  then: (resolve: any) => resolve({ data: [], error: null })
};

export const supabase = {
  auth: {
    signInWithPassword: async (args: any) => ({ data: { session: { user: { id: 'local' } } }, error: null as any }),
    signUp: async (args: any) => ({ data: { user: { id: 'local' } }, error: null as any }),
    signInWithOAuth: async (args: any) => ({ data: { url: '' }, error: null as any }),
    setSession: async (session: any) => ({ data: { session }, error: null as any }),
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: { user: { id: 'local' } } }, error: null as any }),
    getUser: async () => ({ data: { user: { id: 'local' } }, error: null as any }),
    onAuthStateChange: (callback: (event: string, session: any) => void) => ({ data: { subscription: { unsubscribe: () => {} } } })
  },
  from: (table: string) => mockChain,
  rpc: async () => ({ data: [], error: null })
};

// ── Auth helpers ───────────────────────────────────────────
export const authService = {
  async signIn() { return { data: {}, error: null }; },
  async signUp() { return { data: {}, error: null }; },
  async signOut() { return { error: null }; },
  async getSession() { return { data: { session: null }, error: null }; },
  async getProfile() { return { data: { full_name: 'Local User' }, error: null }; },
  async syncProfile() { return { data: { full_name: 'Local User' }, error: null }; },
  async updateProfile() { return { error: null }; },
};

// ── Patient helpers ────────────────────────────────────────
export const patientService = {
  async getAll(userId?: string, searchQuery?: string) { return { data: usePatientStore.getState().patients, error: null }; },
  async getById(id: string) { return { data: usePatientStore.getState().patients.find(p => p.id === id) || null, error: null }; },
  async create(data: any) { 
    const newPatient = { ...data, id: data.id || Math.random().toString(36).substring(7) };
    usePatientStore.getState().addPatient(newPatient);
    return { data: newPatient, error: null }; 
  },
  async update(id: string, data: any) { 
    usePatientStore.getState().updatePatient(id, data);
    return { data, error: null }; 
  },
  async softDelete(id: string) { 
    usePatientStore.getState().removePatient(id);
    return { error: null }; 
  },
  async getSummary() { return { data: {}, error: null }; },
};

// ── Clinical Record helpers ────────────────────────────────
export const recordService = {
  async getByPatient(patientId: string, limit?: number) { 
    return { data: usePatientStore.getState().guestRecords.filter((r: any) => r.patient_id === patientId), error: null }; 
  },
  async getByUser(userId: string) {
    const records = usePatientStore.getState().guestRecords.filter((r: any) => r.user_id === userId || !r.user_id);
    const populated = records.map(r => ({
      ...r,
      patients: usePatientStore.getState().patients.find(pat => pat.id === r.patient_id) || { full_name: 'Anónimo' }
    }));
    return { data: populated, error: null };
  },
  async getById(id: string) { return { data: null as any, error: null }; },
  async getRecent() { return { data: usePatientStore.getState().guestRecords, error: null }; },
  async create(data: any) { 
    const newRecord = { ...data, id: data.id || Math.random().toString(36).substring(7) };
    usePatientStore.getState().addGuestRecord(newRecord);
    return { data: newRecord, error: null }; 
  },
  async update() { return { data: {}, error: null }; },
  async delete() { return { error: null }; },
  async getBMITrend() { return { data: [], error: null }; },
};

// ── Meal Plan helpers ──────────────────────────────────────
export const mealPlanService = {
  async getByPatient(patientId?: string) { return { data: [], error: null }; },
  async create(data: any) { return { data, error: null }; },
  async update() { return { error: null }; },
  async delete() { return { error: null }; },
};

// ── Biochemical helpers ──────────────────────────────────
export const biochemicalService = {
  async getByPatient(patientId?: string) { return { data: [], error: null }; },
  async create(data: any) { return { data, error: null }; },
};

// ── Lifestyle helpers ────────────────────────────────────
export const lifestyleService = {
  async getByPatient(patientId?: string) { return { data: [], error: null }; },
  async create(data: any) { return { data, error: null }; },
};

// ── AI Interaction log ─────────────────────────────────────
export const aiService = {
  async log(data: any) { return { error: null }; },
  async getHistory(patientId?: string) { return { data: [], error: null }; },
};
