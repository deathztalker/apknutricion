export const COLORS = {
  // Backgrounds - Deep space but with more texture/depth
  bg:     '#050505',
  bg1:    '#0d0d12',
  bg2:    '#151520',
  bg3:    '#1c1c2b',
  bg4:    '#252538',

  // Misfits & Halloween Palette
  neon:   '#00ff9f',   // Toxic Green
  poison: '#39ff14',   // Biohazard Green
  crimson:'#ff003c',   // Blood Red
  purple: '#9d00ff',   // Haunted Purple
  orange: '#ff6b00',   // Halloween Pumpkin
  sky:    '#00d0ff',   // Electric Blue
  gold:   '#f5c842',   // Necronomicon Gold

  // Semantic
  red:    '#ff3355',
  info:   '#00ff9f',
  warning:'#ff6b00',
  danger: '#ff003c',

  // Text - High contrast
  text:   '#ffffff',
  muted:  '#a0a0b0',
  dim:    '#4a4a60',
  white:  '#ffffff',
  bone:   '#e5e5e5',

  // Card / Glassmorphism
  card:   'rgba(13,13,18,0.92)',
  border: 'rgba(0,255,159,0.3)',
  borderB:'rgba(255,0,60,0.5)',
};

export const FONTS = {
  regular: 'System',
  bold:    'System',
  horror:  'Creepster_400Regular', // Main Misfits font
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
