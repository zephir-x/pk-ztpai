import React from 'react';
import { User, Bot, Rocket, Code2, Zap, Sparkles, Crown, Flame } from 'lucide-react';
import { AVATAR_PRESETS } from '../constants/theme';

interface AvatarProps {
    avatarUrl?: string | null;
    name?: string | null;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const SIZE_MAP = {
    xs: { box: 'w-6 h-6 text-xs', icon: 12 },
    sm: { box: 'w-8 h-8 text-xs', icon: 16 },
    md: { box: 'w-10 h-10 text-sm', icon: 20 },
    lg: { box: 'w-16 h-16 text-lg', icon: 30 },
    xl: { box: 'w-24 h-24 text-2xl', icon: 44 }
};

export const Avatar: React.FC<AvatarProps> = ({
    avatarUrl,
    name,
    size = 'md',
    className = ''
}) => {
    const config = SIZE_MAP[size] || SIZE_MAP.md;
    const preset = AVATAR_PRESETS.find(p => p.id === avatarUrl);

    // Render preset icon based on iconType
    const renderPresetIcon = (iconType: string, iconSize: number) => {
        switch (iconType) {
            case 'bot':
                return <Bot size={iconSize} className="text-white drop-shadow-sm" />;
            case 'rocket':
                return <Rocket size={iconSize} className="text-white drop-shadow-sm" />;
            case 'code':
                return <Code2 size={iconSize} className="text-white drop-shadow-sm" />;
            case 'zap':
                return <Zap size={iconSize} className="text-white drop-shadow-sm" />;
            case 'sparkles':
                return <Sparkles size={iconSize} className="text-white drop-shadow-sm" />;
            case 'crown':
                return <Crown size={iconSize} className="text-white drop-shadow-sm" />;
            case 'flame':
                return <Flame size={iconSize} className="text-white drop-shadow-sm" />;
            case 'user':
            default:
                return <User size={iconSize} className="text-white drop-shadow-sm" />;
        }
    };

    // If matching preset is found, render stylized gradient avatar
    if (preset) {
        return (
            <div
                className={`${config.box} rounded-full bg-gradient-to-tr ${preset.bgGradient} flex items-center justify-center shadow-sm select-none shrink-0 ${className}`}
                title={name || preset.label}
            >
                {renderPresetIcon(preset.iconType, config.icon)}
            </div>
        );
    }

    // If custom valid URL image is provided
    if (avatarUrl && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.startsWith('data:'))) {
        return (
            <img
                src={avatarUrl}
                alt={name || 'Avatar'}
                className={`${config.box} rounded-full object-cover border border-white/20 shadow-sm shrink-0 ${className}`}
            />
        );
    }

    // Default fallback: initials or anonymous user icon
    const initials = (name || '')
        .split(' ')
        .filter(Boolean)
        .map(part => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    if (initials) {
        return (
            <div
                className={`${config.box} rounded-full bg-gradient-to-tr from-gray-600 to-gray-800 text-white font-bold flex items-center justify-center shadow-sm select-none shrink-0 ${className}`}
                title={name || 'User'}
            >
                {initials}
            </div>
        );
    }

    return (
        <div
            className={`${config.box} rounded-full bg-gradient-to-tr from-gray-500 to-gray-700 flex items-center justify-center shadow-sm select-none shrink-0 ${className}`}
            title={name || 'Anonymous'}
        >
            <User size={config.icon} className="text-white drop-shadow-sm" />
        </div>
    );
};
