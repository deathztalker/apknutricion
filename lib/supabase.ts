// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl  = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xyzplaceholder.supabase.co';
const supabaseKey  = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

// SecureStore adapter para auth tokens
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ── Auth helpers ───────────────────────────────────────────
export const authService = {
  async signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },

  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (data.user && !error) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: 'intern',
      });
    }
    return { data, error };
  },

  async signOut() {
    return supabase.auth.signOut();
  },

  async getSession() {
    return supabase.auth.getSession();
  },

  async getProfile(userId: string) {
    return supabase.from('profiles').select('*').eq('id', userId).single();
  },

  async updateProfile(userId: string, updates: Record<string, unknown>) {
    return supabase.from('profiles').update(updates).eq('id', userId);
  },
};

// ── Patient helpers ────────────────────────────────────────
export const patientService = {
  async getAll(userId: string, search?: string) {
    let query = supabase
      .from('patients')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('full_name');

    if (search) query = query.ilike('full_name', `%${search}%`);
    return query;
  },

  async getById(id: string) {
    return supabase.from('patients').select('*').eq('id', id).single();
  },

  async create(data: Record<string, unknown>) {
    return supabase.from('patients').insert(data).select().single();
  },

  async update(id: string, data: Record<string, unknown>) {
    return supabase.from('patients').update(data).eq('id', id).select().single();
  },

  async softDelete(id: string) {
    return supabase.from('patients').update({ is_active: false }).eq('id', id);
  },

  async getSummary(patientId: string) {
    return supabase.rpc('get_patient_summary', { p_id: patientId });
  },
};

// ── Clinical Record helpers ────────────────────────────────
export const recordService = {
  async getByPatient(patientId: string, limit = 20) {
    return supabase
      .from('clinical_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('record_date', { ascending: false })
      .limit(limit);
  },

  async getById(id: string) {
    return supabase.from('clinical_records').select('*').eq('id', id).single();
  },

  async getRecent(userId: string, limit = 10) {
    return supabase
      .from('clinical_records')
      .select(`*, patients(full_name)`)
      .eq('user_id', userId)
      .order('record_date', { ascending: false })
      .limit(limit);
  },

  async create(data: Record<string, unknown>) {
    return supabase.from('clinical_records').insert(data).select().single();
  },

  async update(id: string, data: Record<string, unknown>) {
    return supabase.from('clinical_records').update(data).eq('id', id).select().single();
  },

  async delete(id: string) {
    return supabase.from('clinical_records').delete().eq('id', id);
  },

  async getBMITrend(patientId: string) {
    return supabase
      .from('clinical_records')
      .select('record_date, bmi, weight_kg, tdee_kcal')
      .eq('patient_id', patientId)
      .not('bmi', 'is', null)
      .order('record_date', { ascending: true })
      .limit(8);
  },
};

// ── Meal Plan helpers ──────────────────────────────────────
export const mealPlanService = {
  async getByPatient(patientId: string) {
    return supabase
      .from('meal_plans')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
  },

  async create(data: Record<string, unknown>) {
    return supabase.from('meal_plans').insert(data).select().single();
  },

  async update(id: string, data: Record<string, unknown>) {
    return supabase.from('meal_plans').update(data).eq('id', id);
  },
async delete(id: string) {
  return supabase.from('meal_plans').delete().eq('id', id);
},
};

// ── Biochemical helpers ──────────────────────────────────
export const biochemicalService = {
async getByPatient(patientId: string) {
  return supabase
    .from('biochemical_records')
    .select('*')
    .eq('patient_id', patientId)
    .order('exam_date', { ascending: false });
},

async create(data: Record<string, unknown>) {
  return supabase.from('biochemical_records').insert(data).select().single();
},
};

// ── Lifestyle helpers ────────────────────────────────────
export const lifestyleService = {
async getByPatient(patientId: string) {
  return supabase
    .from('lifestyle_records')
    .select('*')
    .eq('patient_id', patientId)
    .order('record_date', { ascending: false });
},

async create(data: Record<string, unknown>) {
  return supabase.from('lifestyle_records').insert(data).select().single();
},
};

// ── AI Interaction log ─────────────────────────────────────
export const aiService = {
  async log(data: {
    user_id: string;
    patient_id?: string;
    record_id?: string;
    prompt: string;
    response: string;
    tokens_used?: number;
    interaction_type?: string;
  }) {
    return supabase.from('ai_interactions').insert({
      ...data,
      model: 'claude-sonnet-4-20250514',
    });
  },

  async getHistory(userId: string, patientId?: string) {
    let query = supabase
      .from('ai_interactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (patientId) query = query.eq('patient_id', patientId);
    return query;
  },
};
