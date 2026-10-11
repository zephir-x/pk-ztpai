// Theme accent color definitions mapping to CSS custom properties
export interface AccentPalette {
    id: string;
    label: string;
    primary: string;
    light: string;
    dark: string;
    rgb: string;
    lightRgb: string;
    darkRgb: string;
}

export const ACCENT_PALETTES: Record<string, AccentPalette> = {
    fiery: {
        id: 'fiery',
        label: 'Fiery Orange',
        primary: '#f97316',
        light: '#fbbf24',
        dark: '#ea580c',
        rgb: '249 115 22',
        lightRgb: '251 191 36',
        darkRgb: '234 88 12'
    },
    yellow: {
        id: 'yellow',
        label: 'Amber Yellow',
        primary: '#eab308',
        light: '#fde047',
        dark: '#ca8a04',
        rgb: '234 179 8',
        lightRgb: '253 224 71',
        darkRgb: '202 138 4'
    },
    red: {
        id: 'red',
        label: 'Crimson Red',
        primary: '#ef4444',
        light: '#f87171',
        dark: '#dc2626',
        rgb: '239 68 68',
        lightRgb: '248 113 113',
        darkRgb: '220 38 38'
    },
    purple: {
        id: 'purple',
        label: 'Royal Purple',
        primary: '#a855f7',
        light: '#c084fc',
        dark: '#9333ea',
        rgb: '168 85 247',
        lightRgb: '192 132 252',
        darkRgb: '147 51 234'
    },
    green: {
        id: 'green',
        label: 'Emerald Green',
        primary: '#10b981',
        light: '#34d399',
        dark: '#059669',
        rgb: '16 185 129',
        lightRgb: '52 211 153',
        darkRgb: '5 150 105'
    },
    blue: {
        id: 'blue',
        label: 'Sapphire Blue',
        primary: '#3b82f6',
        light: '#60a5fa',
        dark: '#2563eb',
        rgb: '59 130 246',
        lightRgb: '96 165 250',
        darkRgb: '37 99 235'
    }
};

// Apply chosen accent color variables directly onto the document root
export const applyAccentColor = (accentId: string): void => {
    const palette = ACCENT_PALETTES[accentId] || ACCENT_PALETTES.fiery;
    document.documentElement.style.setProperty('--accent', palette.primary);
    document.documentElement.style.setProperty('--accent-light', palette.light);
    document.documentElement.style.setProperty('--accent-dark', palette.dark);
    document.documentElement.style.setProperty('--accent-rgb', palette.rgb);
    document.documentElement.style.setProperty('--accent-light-rgb', palette.lightRgb);
    document.documentElement.style.setProperty('--accent-dark-rgb', palette.darkRgb);
    localStorage.setItem('app_accent', palette.id);
};

// Predefined avatar presets for quick visual selection
export interface AvatarPreset {
    id: string;
    label: string;
    bgGradient: string;
    iconType: 'user' | 'bot' | 'rocket' | 'code' | 'zap' | 'sparkles' | 'crown';
}

export const AVATAR_PRESETS: AvatarPreset[] = [
    {
        id: 'anonymous',
        label: 'Anonymous',
        bgGradient: 'from-gray-500 to-gray-700',
        iconType: 'user'
    },
    {
        id: 'avatar-1',
        label: 'Astronaut',
        bgGradient: 'from-blue-500 to-indigo-600',
        iconType: 'rocket'
    },
    {
        id: 'avatar-2',
        label: 'Developer',
        bgGradient: 'from-emerald-500 to-teal-700',
        iconType: 'code'
    },
    {
        id: 'avatar-3',
        label: 'Innovator',
        bgGradient: 'from-amber-500 to-orange-600',
        iconType: 'zap'
    },
    {
        id: 'avatar-4',
        label: 'Wizard',
        bgGradient: 'from-purple-500 to-violet-700',
        iconType: 'sparkles'
    },
    {
        id: 'avatar-5',
        label: 'Android',
        bgGradient: 'from-cyan-500 to-blue-600',
        iconType: 'bot'
    },
    {
        id: 'avatar-6',
        label: 'Leader',
        bgGradient: 'from-rose-500 to-pink-600',
        iconType: 'crown'
    }
];

// Available language options
export interface LanguageOption {
    code: string;
    label: string;
    nativeName: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
    { code: 'en', label: 'English', nativeName: 'English (US)' },
    { code: 'pl', label: 'Polish', nativeName: 'Polski (PL)' }
];
