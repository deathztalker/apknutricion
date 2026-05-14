// constants/theme.ts
export const COLORS = {
  // Backgrounds
  bg:      '#0f0f13', // --bg-dark
  bg1:     '#19191e', // Slightly lighter for cards/headers
  bg2:     '#232328',
  bgCard:  'rgba(25, 25, 30, 0.7)', // --bg-card

  // Brand (Horror Punk from HTML)
  neon:    '#00ff88', // --neon-green
  stg:     '#00693E', // --st-green
  pink:    '#ff99cc', // --cute-pink
  purple:  '#9d00ff', // --punk-purple
  
  // Semantic
  gold:    '#ffaa00', 
  red:     '#ff0055', 
  sky:     '#00d0ff', 

  // Text
  text:    '#e2e2e2', // --text-main
  muted:   '#a0a0a0', // --text-muted
  dim:     '#606060',
  white:   '#ffffff',

  // Borders
  border:  'rgba(0, 255, 136, 0.2)', // Neon green border
  borderP: 'rgba(255, 153, 204, 0.3)', // Pinkish border
};

export const FONTS = {
  horror:  'Creepster_400Regular',
  outfit:  'System', // We'll stick to system for body or load Outfit if needed
  fredoka: 'System',
};

export const SHADOWS = {
  neon: {
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  pink: {
    shadowColor: '#ff99cc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  purple: {
    shadowColor: '#9d00ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
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
