export type AppTheme = 'light' | 'warm' | 'dark' | 'midnight';
export type AppFont = 'jakarta' | 'dmsans' | 'lora' | 'mono';
export type FontSizeOption = 'small' | 'medium' | 'large' | 'xlarge';

export interface UserPreferences {
  userName: string;
  relationship: string;
  customNote: string;
}

export interface AppSettings {
  theme: AppTheme;
  font: AppFont;
  fontSize: FontSizeOption;
  user: UserPreferences;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'light',
  font: 'jakarta',
  fontSize: 'medium',
  user: {
    userName: '',
    relationship: 'Rekan Diskusi',
    customNote: '',
  },
};

export const THEME_OPTIONS: {
  id: AppTheme;
  label: string;
  description: string;
  isDark: boolean;
  swatchBg: string;
  swatchSurface: string;
  swatchText: string;
  swatchAccent: string;
}[] = [
  {
    id: 'light',
    label: 'Terang',
    description: 'Kanvas putih bersih & netral',
    isDark: false,
    swatchBg: '#F8F9FA',
    swatchSurface: '#FFFFFF',
    swatchText: '#0F172A',
    swatchAccent: '#4F46E5',
  },
  {
    id: 'warm',
    label: 'Kertas Hangat',
    description: 'Nuansa krem lembut ramah mata',
    isDark: false,
    swatchBg: '#F5F0E6',
    swatchSurface: '#FCF9F2',
    swatchText: '#292524',
    swatchAccent: '#B45309',
  },
  {
    id: 'dark',
    label: 'Gelap',
    description: 'Slate gelap kontras tinggi',
    isDark: true,
    swatchBg: '#0F172A',
    swatchSurface: '#1E293B',
    swatchText: '#F1F5F9',
    swatchAccent: '#818CF8',
  },
  {
    id: 'midnight',
    label: 'Tengah Malam',
    description: 'Indigo pekat untuk fokus malam',
    isDark: true,
    swatchBg: '#090B14',
    swatchSurface: '#13172B',
    swatchText: '#E2E8F0',
    swatchAccent: '#A5B4FC',
  },
];

export const FONT_OPTIONS: {
  id: AppFont;
  label: string;
  category: string;
  cssFamily: string;
  sampleText: string;
}[] = [
  {
    id: 'jakarta',
    label: 'Plus Jakarta Sans',
    category: 'Sans Modern',
    cssFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
    sampleText: 'Jelas, rapi, dan seimbang untuk percakapan.',
  },
  {
    id: 'dmsans',
    label: 'DM Sans',
    category: 'Sans Humanis',
    cssFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
    sampleText: 'Ringkas, ramah, dan nyaman dibaca cepat.',
  },
  {
    id: 'lora',
    label: 'Lora',
    category: 'Editorial Serif',
    cssFamily: '"Lora", Georgia, ui-serif, serif',
    sampleText: 'Bernuansa sastra untuk roleplay mendalam.',
  },
  {
    id: 'mono',
    label: 'JetBrains Mono',
    category: 'Monospace',
    cssFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
    sampleText: 'Presisi teknis & karakter terukur.',
  },
];

export const FONT_SIZE_OPTIONS: {
  id: FontSizeOption;
  label: string;
  px: number;
}[] = [
  { id: 'small', label: 'Kecil', px: 13 },
  { id: 'medium', label: 'Sedang', px: 15 },
  { id: 'large', label: 'Besar', px: 17 },
  { id: 'xlarge', label: 'Ekstra Besar', px: 19 },
];

export const RELATIONSHIP_PRESETS: string[] = [
  'Rekan Diskusi',
  'Sahabat Dekat',
  'Pasangan',
  'Mentor & Murid',
  'Rekan Kerja',
  'Rival',
  'Orang Asing',
];

export const PRESET_AVATARS: { label: string; url: string }[] = [
  {
    label: 'Aiko (Analis)',
    url: '/src/assets/images/avatar_aiko_tsundere_1794836108186.jpg',
  },
  {
    label: 'Rei (Minimalis)',
    url: '/src/assets/images/avatar_rei_kuudere_1794836106995.jpg',
  },
  {
    label: 'Yuna (Pendamping)',
    url: '/src/assets/images/avatar_yuna_yandere_1794836107178.jpg',
  },
  {
    label: 'Sora (Kreator)',
    url: '/src/assets/images/avatar_sora_genki_1794836108807.jpg',
  },
];

const VALID_THEMES = new Set<AppTheme>(['light', 'warm', 'dark', 'midnight']);
const VALID_FONTS = new Set<AppFont>(['jakarta', 'dmsans', 'lora', 'mono']);
const VALID_FONT_SIZES = new Set<FontSizeOption>(['small', 'medium', 'large', 'xlarge']);

export function sanitizeAppSettings(raw: unknown): AppSettings {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const theme: AppTheme =
    typeof obj.theme === 'string' && VALID_THEMES.has(obj.theme as AppTheme)
      ? (obj.theme as AppTheme)
      : DEFAULT_APP_SETTINGS.theme;

  const font: AppFont =
    typeof obj.font === 'string' && VALID_FONTS.has(obj.font as AppFont)
      ? (obj.font as AppFont)
      : DEFAULT_APP_SETTINGS.font;

  const fontSize: FontSizeOption =
    typeof obj.fontSize === 'string' && VALID_FONT_SIZES.has(obj.fontSize as FontSizeOption)
      ? (obj.fontSize as FontSizeOption)
      : DEFAULT_APP_SETTINGS.fontSize;

  const userObj = (obj.user && typeof obj.user === 'object' ? obj.user : {}) as Record<
    string,
    unknown
  >;

  const userName =
    typeof userObj.userName === 'string'
      ? userObj.userName.slice(0, 60)
      : DEFAULT_APP_SETTINGS.user.userName;

  const relationship =
    typeof userObj.relationship === 'string' && userObj.relationship.trim()
      ? userObj.relationship.slice(0, 60)
      : DEFAULT_APP_SETTINGS.user.relationship;

  const customNote =
    typeof userObj.customNote === 'string'
      ? userObj.customNote.slice(0, 240)
      : DEFAULT_APP_SETTINGS.user.customNote;

  return {
    theme,
    font,
    fontSize,
    user: {
      userName,
      relationship,
      customNote,
    },
  };
}
