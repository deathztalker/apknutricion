export const COLORS = {
  // Backgrounds - Deep Space Horror / Professional Dark
  bg:     '#050505',
  bg1:    '#0A0A0E',
  bg2:    '#12121A',
  bg3:    '#1A1A24',
  bg4:    '#222230',

  // Horrorpunk Palette
  neon:   '#00FF9F',   // Toxic Green
  poison: '#39FF14',   // Biohazard Green
  crimson:'#FF003C',   // Blood Red
  purple: '#9D00FF',   // Haunted Purple
  pink:   '#FF00FF',   // Shocking Pink
  orange: '#FF6B00',   // Halloween Pumpkin
  sky:    '#00D0FF',   // Electric Blue
  gold:   '#F5C842',   // Necronomicon Gold
  stg:    '#00693E',   // Dark Swamp

  // Semantic mappings (using horror palette)
  primary: '#FF003C',  // Crimson is now primary
  secondary: '#00FF9F', // Toxic Green as secondary
  accent: '#9D00FF',    // Purple accent
  success: '#00FF9F',
  info:    '#00D0FF',
  warning: '#FF6B00',
  danger:  '#FF003C',
  red:     '#FF003C',

  // Text - High contrast
  text:   '#F8FAFC',
  muted:  '#A0A0B0',
  dim:    '#707080',
  white:  '#FFFFFF',
  bone:   '#F0F0F0',

  // Card / Glassmorphism
  card:   'rgba(15, 15, 20, 0.95)',
  border: 'rgba(255, 0, 60, 0.4)', // Crimson border
  borderB:'rgba(0, 255, 159, 0.3)', // Neon border
};

export const FONTS = {
  regular: 'System',
  bold:    'System',
  horror:  'Creepster_400Regular', // Horror font restored
  space:   'SpaceMono_400Regular',
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
  primary: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 15,
    elevation: 10,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  neon: {
    shadowColor: COLORS.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  pink: {
    shadowColor: COLORS.pink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  crimson: {
    shadowColor: COLORS.crimson,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 12,
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
