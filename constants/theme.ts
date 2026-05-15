// constants/theme.ts - MISFITS HORROR-PUNK EDITION

export const COLORS = {
  // Pure Void
  bg:      '#050505', 
  bg1:     '#0a0a0d', 
  bg2:     '#111116',
  bg3:     '#18181f',
  bg4:     '#22222b',
  bgCard:  'rgba(10, 10, 13, 0.95)', 

  // Misfits Identity
  crimson: '#dc143c', // --misfits-red
  bone:    '#f5f5f5', // --misfits-white
  poison:  '#39ff14', // --toxic-green
  void:    '#000000',
  
  // Terminal Assets
  neon:    '#dc143c', 
  stg:     '#800000', 
  pink:    '#ff0033', 
  purple:  '#6600cc', 
  
  // Semantic
  gold:    '#ffd700', 
  red:     '#ff0000', 
  sky:     '#00ccff', 

  // Text Hierarchy
  text:    '#f5f5f5', 
  muted:   '#8a8a8a', 
  dim:     '#444444',
  white:   '#ffffff',

  // Borders
  border:  'rgba(220, 20, 60, 0.4)', 
  borderP: 'rgba(57, 255, 20, 0.3)', 
} as const;

export const FONTS = {
  horror:  'Creepster_400Regular',
  outfit:  'System', 
  fredoka: 'System',
} as const;

export const SHADOWS = {
  crimson: {
    shadowColor: '#dc143c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  poison: {
    shadowColor: '#39ff14',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  neon: {
    shadowColor: '#dc143c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  pink: {
    shadowColor: '#ff0033',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  purple: {
    shadowColor: '#6600cc',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
} as const;

export const ACTIVITY_FACTORS = [
  { label: 'Sedentario (sin ejercicio)', value: '1.2' },
  { label: 'Ligero (1–3 días/sem)', value: '1.375' },
  { label: 'Moderado (3–5 días/sem)', value: '1.55' },
  { label: 'Activo (6–7 días/sem)', value: '1.725' },
  { label: 'Muy activo (2×/día)', value: '1.9' },
] as const;

export const DIET_TYPES = [
  'Omnívora', 'Vegetariana', 'Vegana', 'Ovolactovegetariana',
  'Pescatariana', 'Keto / Baja en HC', 'Sin Gluten', 'Sin Lactosa',
] as const;

export const INSURANCE_OPTIONS = ['FONASA', 'ISAPRE', 'NINGUNA', 'OTRO'] as const;

export const COMMUNES_CHILE = [
  'Santiago', 'Providencia', 'Las Condes', 'Maipú', 'La Florida', 'Puente Alto',
  'Vitacura', 'La Reina', 'Ñuñoa', 'Macul', 'San Miguel', 'La Cisterna',
  'El Bosque', 'Pedro Aguirre Cerda', 'San Ramón', 'Lo Espejo', 'Cerrillos',
  'Estación Central', 'Lo Prado', 'Pudahuel', 'Quinta Normal', 'Renca',
  'Conchalí', 'Huechuraba', 'Recoleta', 'Independencia', 'Peñalolén',
  'Quilicura', 'Colina', 'Talca', 'Concepción', 'Valparaíso', 'Otro',
] as const;
