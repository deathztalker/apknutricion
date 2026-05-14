// constants/theme.ts
export const COLORS = {
  // Backgrounds
  bg:     '#050505', // Deep abyss black
  bg1:    '#0f0a0a', // Dark blood undertone
  bg2:    '#1a1111', // Slightly lighter dark red-black
  bg3:    '#251515',
  bg4:    '#301b1b',

  // Brand (Horror Punk)
  neon:   '#a3ff00', // Toxic Acid Green
  neon2:  '#7acc00',
  stg:    '#00693e', // Keep original STG just in case, or change to darker green
  pink:   '#ff003c', // Blood Red / Neon Red
  pink2:  '#cc0030', // Darker Blood Red
  purple: '#8000ff', // Deep ultraviolet
  purple2:'#5500aa',

  // Semantic
  gold:   '#ffaa00', // Warning orange-gold
  red:    '#ff0000', // Pure bright red
  sky:    '#00ffff', // Cyan for contrast
  orange: '#ff5500',

  // Text
  text:   '#e0e0e0',
  muted:  '#807070', // Grey with red hue
  dim:    '#504040',
  white:  '#ffffff',

  // Card
  card:   'rgba(26, 17, 17, 0.95)',
  border: 'rgba(255, 0, 60, 0.3)', // Red border
  borderB:'rgba(163, 255, 0, 0.4)', // Acid green border
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
    shadowColor: '#a3ff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  pink: {
    shadowColor: '#ff003c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
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
