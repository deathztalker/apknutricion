export const COLORS = {
  // Backgrounds
  bg:     '#0b0d12',
  bg1:    '#0f1219',
  bg2:    '#141820',
  bg3:    '#1a2030',
  bg4:    '#1e2640',

  // Brand
  neon:   '#00ff88',
  neon2:  '#00cc6a',
  stg:    '#00693e',   // Santo Tomás Green
  pink:   '#ff6eb4',
  pink2:  '#e05090',
  purple: '#9d4dff',
  purple2:'#7a30dd',

  // Semantic
  gold:   '#f5c842',
  red:    '#ff3355',
  sky:    '#00d0ff',
  orange: '#ff6b2b',

  // Text
  text:   '#eef2ff',
  muted:  '#7a8a9a',
  dim:    '#3a4a5a',
  white:  '#ffffff',

  // Card
  card:   'rgba(20,24,32,0.9)',
  border: 'rgba(0,255,136,0.15)',
  borderB:'rgba(0,255,136,0.4)',
};

export const FONTS = {
  regular: 'System',
  bold:    'System',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const SHADOWS = {
  neon: {
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  pink: {
    shadowColor: '#ff6eb4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
};

export const ACTIVITY_FACTORS = [
  { label: 'Sedentario (sin ejercicio)', value: '1.2' },
  { label: 'Ligero (1–3 días/sem)', value: '1.375' },
  { label: 'Moderado (3–5 días/sem)', value: '1.55' },
  { label: 'Activo (6–7 días/sem)', value: '1.725' },
  { label: 'Muy activo (2×/día)', value: '1.9' },
];

export const DIET_TYPES = [
  'Omnívora', 'Vegetariana', 'Vegana', 'Ovolactovegetariana',
  'Pescatariana', 'Keto / Baja en HC', 'Sin Gluten', 'Sin Lactosa',
];

export const INSURANCE_OPTIONS = ['FONASA', 'ISAPRE', 'NINGUNA', 'OTRO'];

export const COMMUNES_CHILE = [
  'Santiago', 'Providencia', 'Las Condes', 'Maipú', 'La Florida', 'Puente Alto',
  'Vitacura', 'La Reina', 'Ñuñoa', 'Macul', 'San Miguel', 'La Cisterna',
  'El Bosque', 'Pedro Aguirre Cerda', 'San Ramón', 'Lo Espejo', 'Cerrillos',
  'Estación Central', 'Lo Prado', 'Pudahuel', 'Quinta Normal', 'Renca',
  'Conchalí', 'Huechuraba', 'Recoleta', 'Independencia', 'Peñalolén',
  'Quilicura', 'Colina', 'Talca', 'Concepción', 'Valparaíso', 'Otro',
];
