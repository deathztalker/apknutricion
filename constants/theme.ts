// constants/theme.ts - PREMIUM CLINICAL V10 (BRIGHTER & HORROR-PUNK)
export const COLORS = {
  // Deep Backgrounds (Abyssal Blue/Grey, lighter for legibility)
  bg:      '#0b0b12', 
  bg1:     '#15151e', 
  bg2:     '#1f1f2c',
  bg3:     '#2a2a3b',
  bg4:     '#36364b',
  bgCard:  'rgba(30, 30, 45, 0.95)', 

  // Misfits Identity - Brightened for clinical screens
  crimson: '#FF2A55', // Vibrant, legible Crimson
  bone:    '#FDFDFD', // Off-white to reduce eye strain
  poison:  '#00FF88', // Medical Neon Green
  void:    '#000000',
  
  // Terminal Assets
  neon:    '#FF2A55', 
  stg:     '#D41133', 
  pink:    '#FF4D88', 
  purple:  '#B366FF', 
  
  // Semantic
  gold:    '#FFCC00', 
  red:     '#FF3333', 
  sky:     '#00E5FF', 

  // Text Hierarchy - MAX LEGIBILITY
  text:    '#FFFFFF', // Primary text
  muted:   '#E0E0EB', // Secondary text
  dim:     '#B0B0C0', // Tertiary / Labels (Lightened from #9595A5)
  white:   '#FFFFFF',

  // Borders & Glass
  border:  'rgba(255, 255, 255, 0.15)', 
  borderP: 'rgba(255, 42, 85, 0.5)', 
  glass:   'rgba(255, 255, 255, 0.08)',
} as const;

export const FONTS = {
  horror:  'Creepster_400Regular', // Bring back the Misfits Horror Vibe
  outfit:  'System', 
  fredoka: 'System',
} as const;

export const SHADOWS = {
  crimson: {
    shadowColor: '#FF2A55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  poison: {
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  neon: {
    shadowColor: '#FF2A55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  pink: {
    shadowColor: '#FF4D88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  purple: {
    shadowColor: '#B366FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  glass: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  }
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
