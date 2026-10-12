import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { userService } from '../api/userService';
import { usePageTitle } from '../hooks/usePageTitle';
import { Avatar } from '../components/Avatar';
import { 
    ACCENT_PALETTES, 
    AVATAR_PRESETS, 
    LANGUAGE_OPTIONS, 
    applyAccentColor 
} from '../constants/theme';
import { 
    Settings as SettingsIcon, 
    User, 
    Palette, 
    Globe, 
    Lock, 
    Check, 
    Mail, 
    Shield, 
    Save, 
    AlertCircle 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import { type SupportedLanguage } from '../i18n/types';
import { en } from '../i18n/translations/en';
import { pl } from '../i18n/translations/pl';

export default function Settings() {
    const { t, language, setLanguage } = useTranslation();
    usePageTitle(t.settings.title);
    const { profile, user, refreshProfile, setProfile } = useAuth();

    // Form fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('anonymous');
    const [selectedAccent, setSelectedAccent] = useState('fiery');
    const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');

    // Password change fields
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // State management
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Populate form values from user profile
    useEffect(() => {
        if (profile) {
            setFirstName(profile.firstName || '');
            setLastName(profile.lastName || '');
            setSelectedAvatar(profile.avatarUrl || 'anonymous');
            setSelectedAccent(profile.accentColor || 'fiery');
            const userLang = (profile.language === 'pl' || profile.language === 'en') ? profile.language : language;
            setSelectedLanguage(userLang);
        }
    }, [profile, language]);

    // Accent selection only updates local form state until saved
    const handleAccentSelect = (accentId: string) => {
        setSelectedAccent(accentId);
    };

    const isChangingPassword = newPassword.length > 0;

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        const targetTranslations = selectedLanguage === 'pl' ? pl : en;

        if (isChangingPassword) {
            if (!currentPassword) {
                setErrorMessage(targetTranslations.settings.notifications.currentPasswordRequired);
                toast.error(targetTranslations.settings.notifications.currentPasswordRequired);
                return;
            }
            if (newPassword !== confirmPassword) {
                setErrorMessage(targetTranslations.settings.notifications.passwordsMismatch);
                toast.error(targetTranslations.settings.notifications.passwordsMismatch);
                return;
            }
            if (newPassword.length < 6) {
                setErrorMessage(targetTranslations.settings.notifications.minPasswordLength);
                toast.error(targetTranslations.settings.notifications.minPasswordLength);
                return;
            }
        }

        setIsLoading(true);
        try {
            const updated = await userService.updateProfile({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                avatarUrl: selectedAvatar,
                language: selectedLanguage,
                accentColor: selectedAccent,
                currentPassword: isChangingPassword ? currentPassword : undefined,
                newPassword: isChangingPassword ? newPassword : undefined
            });

            // Update user profile in auth context
            setProfile(updated);

            // Apply selected accent color globally upon successful save
            applyAccentColor(updated.accentColor);

            // Apply chosen language globally
            setLanguage(selectedLanguage);

            await refreshProfile();

            // Clear password fields on success
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            toast.success(targetTranslations.settings.notifications.saveSuccess);
        } catch (err) {
            if (err instanceof AxiosError && err.response?.data) {
                const data = err.response.data;
                const msg = data.message || (data.errors ? Object.values(data.errors).flat().join(' ') : targetTranslations.settings.notifications.saveError);
                setErrorMessage(msg);
                toast.error(msg);
            } else {
                setErrorMessage(targetTranslations.settings.notifications.saveError);
                toast.error(targetTranslations.settings.notifications.saveError);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const displayName = `${firstName} ${lastName}`.trim() || user?.email || t.common.user;
    const isUserAdmin = profile?.role === 1 || profile?.role === 'Admin';

    return (
        <div className="h-full flex flex-col max-w-4xl mx-auto w-full">
            {/* Header Section: lowered by pt-[26px] for universal page alignment */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 relative z-10 pt-[26px]">
                <div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3 drop-shadow-md">
                        <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 shadow-glass-sm ring-1 ring-fiery/40">
                            <SettingsIcon className="text-fiery drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.7)]" size={26} />
                        </div>
                        <span>{t.settings.title}</span>
                    </h2>
                    <p className="text-rain-200 text-sm mt-2 font-medium drop-shadow-sm">
                        {t.settings.subtitle}
                    </p>
                </div>
            </div>

            {/* Content Area - Clean flow without hard straight shadow lines between modules */}
            <div className="flex-1 pb-16 space-y-6">
                {/* Error Banner */}
                {errorMessage && (
                    <div className="bg-red-500/20 text-red-100 border border-red-400/40 px-4 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-md shadow-glow-crimson/20">
                        <AlertCircle size={20} className="text-red-400 shrink-0" />
                        <span className="text-sm font-medium">{errorMessage}</span>
                    </div>
                )}

                {/* Profile Overview Card */}
                <div className="relative p-6 sm:p-7 flex flex-col sm:flex-row items-center gap-6 border border-white/15 bg-rain-950/60 backdrop-blur-2xl rounded-2xl shadow-none overflow-hidden">
                    <div className="shrink-0 relative">
                        <Avatar avatarUrl={profile?.avatarUrl || 'anonymous'} name={displayName} size="xl" />
                    </div>
                    <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate drop-shadow-sm">
                                {displayName}
                            </h3>
                            {isUserAdmin ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-fiery/15 text-fiery border border-fiery/30 shadow-[0_0_12px_rgba(var(--accent-rgb),0.25)] self-center sm:self-auto shrink-0">
                                    <Shield size={12} />
                                    <span>{t.settings.profileOverview.administrator}</span>
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/90 border border-white/15 self-center sm:self-auto shrink-0">
                                    <Shield size={12} />
                                    <span>{t.settings.profileOverview.standardUser}</span>
                                </span>
                            )}
                        </div>
                        <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-rain-200">
                            <Mail size={13} className="text-rain-300 shrink-0" />
                            <span className="truncate">{user?.email}</span>
                        </div>
                        <p className="text-xs text-rain-300 font-medium">
                            {t.settings.profileOverview.memberSince}: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US') : 'N/A'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Predefined Avatar Picker - Centered layout */}
                    <div className="relative p-6 sm:p-7 space-y-4 rounded-2xl border border-white/15 bg-rain-950/60 backdrop-blur-2xl shadow-none overflow-hidden">
                        <div className="flex items-center gap-2.5 text-base font-bold text-white border-b border-white/10 pb-3">
                            <User size={18} className="text-fiery" />
                            <span>{t.settings.avatarSection.title}</span>
                        </div>
                        <p className="text-xs text-rain-200 font-medium">
                            {t.settings.avatarSection.subtitle}
                        </p>

                        <div className="flex flex-wrap justify-center gap-3.5 pt-1">
                            {AVATAR_PRESETS.map((preset) => {
                                const isSelected = selectedAvatar === preset.id;
                                const localizedLabel = (t.settings.avatarSection.avatars as Record<string, string>)[preset.id] || preset.label;
                                return (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => setSelectedAvatar(preset.id)}
                                        className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 hover:scale-105 cursor-pointer ${
                                            isSelected
                                                ? 'bg-fiery/20 ring-2 ring-fiery border border-fiery/50 shadow-glow-accent/30 scale-105'
                                                : 'bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white'
                                        }`}
                                    >
                                        <div className="relative">
                                            <Avatar avatarUrl={preset.id} name={localizedLabel} size="lg" />
                                            {isSelected && (
                                                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-fiery text-white flex items-center justify-center shadow-md">
                                                    <Check size={12} strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs font-semibold text-white/90">
                                            {localizedLabel}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 2: Personal Information */}
                    <div className="relative p-6 sm:p-7 space-y-4 rounded-2xl border border-white/15 bg-rain-950/60 backdrop-blur-2xl shadow-none overflow-hidden">
                        <div className="flex items-center gap-2.5 text-base font-bold text-white border-b border-white/10 pb-3">
                            <User size={18} className="text-fiery" />
                            <span>{t.settings.personalInfo.title}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-rain-200 mb-1.5">
                                    {t.settings.personalInfo.firstName}
                                </label>
                                <input
                                    type="text"
                                    className="input-glass"
                                    placeholder={t.settings.personalInfo.firstNamePlaceholder}
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    maxLength={50}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-rain-200 mb-1.5">
                                    {t.settings.personalInfo.lastName}
                                </label>
                                <input
                                    type="text"
                                    className="input-glass"
                                    placeholder={t.settings.personalInfo.lastNamePlaceholder}
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    maxLength={50}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-rain-200 mb-1.5">
                                    {t.settings.personalInfo.email}
                                </label>
                                <input
                                    type="email"
                                    disabled
                                    className="input-glass bg-white/[0.04] text-rain-300 border-white/10 cursor-not-allowed opacity-80"
                                    value={user?.email || ''}
                                />
                                <p className="text-[11px] text-rain-400 mt-1">{t.settings.personalInfo.emailNotice}</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-rain-200 mb-1.5">
                                    {t.settings.personalInfo.role}
                                </label>
                                <input
                                    type="text"
                                    disabled
                                    className="input-glass bg-white/[0.04] text-rain-300 border-white/10 cursor-not-allowed opacity-80"
                                    value={isUserAdmin ? t.settings.profileOverview.administrator : t.settings.profileOverview.standardUser}
                                />
                                <p className="text-[11px] text-rain-400 mt-1">{t.settings.personalInfo.roleNotice}</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: App Theme Accent Color - Equal size grid, 3 per row on desktop */}
                    <div className="relative p-6 sm:p-7 space-y-4 rounded-2xl border border-white/15 bg-rain-950/60 backdrop-blur-2xl shadow-none overflow-hidden">
                        <div className="flex items-center gap-2.5 text-base font-bold text-white border-b border-white/10 pb-3">
                            <Palette size={18} className="text-fiery" />
                            <span>{t.settings.accentColor.title}</span>
                        </div>
                        <p className="text-xs text-rain-200 font-medium">
                            {t.settings.accentColor.subtitle}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-1 w-full">
                            {Object.values(ACCENT_PALETTES).map((accent) => {
                                const isSelected = selectedAccent === accent.id;
                                const localizedName = (t.settings.accentColor.colors as Record<string, string>)[accent.id] || accent.label;
                                return (
                                    <button
                                        key={accent.id}
                                        type="button"
                                        onClick={() => handleAccentSelect(accent.id)}
                                        className={`w-full h-16 flex items-center gap-3.5 px-4 py-3 rounded-2xl border transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
                                            isSelected
                                                ? 'bg-fiery/15 border-fiery/60 ring-2 ring-fiery shadow-glow-accent/30 text-white'
                                                : 'bg-white/5 border-white/10 hover:bg-white/10 text-rain-200 hover:text-white'
                                        }`}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform shadow-md"
                                            style={{ backgroundColor: accent.primary }}
                                        >
                                            {isSelected && <Check size={16} className="text-white drop-shadow-md" strokeWidth={3} />}
                                        </div>
                                        <div className="text-left min-w-0 flex-1">
                                            <div className="text-sm font-bold text-white truncate">{localizedName}</div>
                                            <div className="text-[10px] text-rain-300 font-mono truncate">{accent.primary}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 4: Interface Language - Uniform grid with matching height */}
                    <div className="relative p-6 sm:p-7 space-y-4 rounded-2xl border border-white/15 bg-rain-950/60 backdrop-blur-2xl shadow-none overflow-hidden">
                        <div className="flex items-center gap-2.5 text-base font-bold text-white border-b border-white/10 pb-3">
                            <Globe size={18} className="text-fiery" />
                            <span>{t.settings.languageSection.title}</span>
                        </div>
                        <p className="text-xs text-rain-200 font-medium">
                            {t.settings.languageSection.subtitle}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1 w-full">
                            {LANGUAGE_OPTIONS.map((lang) => {
                                const isSelected = selectedLanguage === lang.code;
                                return (
                                    <button
                                        key={lang.code}
                                        type="button"
                                        onClick={() => setSelectedLanguage(lang.code as SupportedLanguage)}
                                        className={`w-full h-16 flex items-center justify-between px-4 py-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                            isSelected
                                                ? 'bg-fiery/15 border-fiery/50 ring-2 ring-fiery/40 shadow-glow-accent/20 text-white'
                                                : 'bg-white/5 border-white/10 hover:bg-white/10 text-rain-200 hover:text-white'
                                        }`}
                                    >
                                        <div>
                                            <div className="text-sm font-bold text-white">{lang.nativeName}</div>
                                            <div className="text-xs text-rain-300">{lang.label} ({lang.code.toUpperCase()})</div>
                                        </div>
                                        {isSelected && (
                                            <div className="w-6 h-6 rounded-full bg-fiery text-white flex items-center justify-center shadow shrink-0">
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 5: Security / Change Password */}
                    <div className="relative p-6 sm:p-7 space-y-4 rounded-2xl border border-white/15 bg-rain-950/60 backdrop-blur-2xl shadow-none overflow-hidden">
                        <div className="flex items-center gap-2.5 text-base font-bold text-white border-b border-white/10 pb-3">
                            <Lock size={18} className="text-fiery" />
                            <span>{t.settings.security.title}</span>
                        </div>
                        <p className="text-xs text-rain-200 font-medium">
                            {t.settings.security.subtitle}
                        </p>

                        <div className="space-y-4 pt-1">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-rain-200 mb-1.5">
                                    {t.settings.security.currentPassword}
                                </label>
                                <input
                                    type="password"
                                    className="input-glass"
                                    placeholder={t.settings.security.currentPasswordPlaceholder}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-rain-200 mb-1.5">
                                        {t.settings.security.newPassword}
                                    </label>
                                    <input
                                        type="password"
                                        className="input-glass"
                                        placeholder={t.settings.security.newPasswordPlaceholder}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-rain-200 mb-1.5">
                                        {t.settings.security.confirmPassword}
                                    </label>
                                    <input
                                        type="password"
                                        className={"input-glass transition-colors duration-300 " + (
                                            newPassword && confirmPassword && newPassword === confirmPassword 
                                                ? 'border-emerald-500 ring-1 ring-emerald-500' 
                                                : (newPassword && confirmPassword && newPassword !== confirmPassword ? 'border-red-500 ring-1 ring-red-500' : '')
                                        )}
                                        placeholder={t.settings.security.confirmPasswordPlaceholder}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Save Changes Button Bar */}
                    <div className="flex justify-end pt-3">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-fiery flex items-center gap-2 px-7 py-3 text-sm font-bold shadow-lg cursor-pointer disabled:opacity-50"
                        >
                            <Save size={16} />
                            <span>{isLoading ? t.common.saving : t.common.save}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
