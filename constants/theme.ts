// constants/theme.ts - MISFITS HORROR-PUNK EDITION (V8 ULTRA-CONTRAST)
export const COLORS = {
  // Deep Backgrounds
  bg:      '#010103', 
  bg1:     '#0f0f16', 
  bg2:     '#1a1a24',
  bg3:     '#242430',
  bg4:     '#2e2e3d',
  bgCard:  'rgba(15, 15, 22, 0.99)', 

  // Misfits Identity - Neon Brightness
  crimson: '#ff003c', // Electric Crimson
  bone:    '#ffffff', // Pure White
  poison:  '#39ff14', // Nuclear Green
  void:    '#000000',
  
  // Terminal Assets
  neon:    '#ff003c', 
  stg:     '#cc0033', 
  pink:    '#ff4d88', 
  purple:  '#b366ff', 
  
  // Semantic
  gold:    '#ffcc00', 
  red:     '#ff1a1a', 
  sky:     '#00e5ff', 

  // Text Hierarchy - MAX LEGIBILITY
  text:    '#ffffff', // Primary
  muted:   '#e0e0e0', // High-contrast secondary
  dim:     '#a0a0a0', // Labels
  white:   '#ffffff',

  // Borders
  border:  'rgba(255, 0, 60, 0.8)', 
  borderP: 'rgba(57, 255, 20, 0.7)', 
} as const;

export const FONTS = {
  horror:  'Creepster_400Regular',
  outfit:  'System', 
  fredoka: 'System',
} as const;

export const SHADOWS = {
  crimson: {
    shadowColor: '#ff003c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 25,
  },
  poison: {
    shadowColor: '#39ff14',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  neon: {
    shadowColor: '#ff003c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 25,
  },
  pink: {
    shadowColor: '#ff4d88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  purple: {
    shadowColor: '#b366ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
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
