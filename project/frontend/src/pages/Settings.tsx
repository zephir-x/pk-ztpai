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
        <div className="max-w-4xl mx-auto w-full pb-16 space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-matte-dark flex items-center gap-2">
                        <SettingsIcon className="text-fiery" /> {t.settings.title}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        {t.settings.subtitle}
                    </p>
                </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
                <div className="glass-panel bg-red-50/80 border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
                    <AlertCircle size={20} className="text-red-500 shrink-0" />
                    <span className="text-sm font-medium">{errorMessage}</span>
                </div>
            )}

            {/* Profile Overview Card (displays permanently saved avatar until saved) */}
            <div className="glass-panel p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-center gap-6 border border-gray-100">
                <div className="shrink-0">
                    <Avatar avatarUrl={profile?.avatarUrl || 'anonymous'} name={displayName} size="xl" />
                </div>
                <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <h3 className="text-xl font-bold text-matte-dark truncate">{displayName}</h3>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 self-center sm:self-auto shrink-0">
                            <Shield size={12} />
                            {isUserAdmin ? t.settings.profileOverview.administrator : t.settings.profileOverview.standardUser}
                        </span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-gray-500">
                        <Mail size={14} className="text-gray-400 shrink-0" />
                        <span className="truncate">{user?.email}</span>
                    </div>
                    <p className="text-xs text-gray-400">
                        {t.settings.profileOverview.memberSince}: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US') : 'N/A'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Section 1: Predefined Avatar Picker */}
                <div className="glass-panel p-6 sm:p-8 space-y-4">
                    <div className="flex items-center gap-2 text-base font-bold text-matte-dark border-b border-gray-200/60 pb-3">
                        <User size={18} className="text-fiery" />
                        <span>{t.settings.avatarSection.title}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                        {t.settings.avatarSection.subtitle}
                    </p>

                    <div className="flex flex-wrap gap-4 pt-2">
                        {AVATAR_PRESETS.map((preset) => {
                            const isSelected = selectedAvatar === preset.id;
                            const localizedLabel = (t.settings.avatarSection.avatars as Record<string, string>)[preset.id] || preset.label;
                            return (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => setSelectedAvatar(preset.id)}
                                    className={`relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                                        isSelected
                                            ? 'bg-gray-100/90 ring-2 ring-offset-2 ring-matte-dark'
                                            : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="relative">
                                        <Avatar avatarUrl={preset.id} name={localizedLabel} size="lg" />
                                        {isSelected && (
                                            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-matte-dark text-white flex items-center justify-center shadow-md">
                                                <Check size={14} />
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs font-semibold text-matte-dark">
                                        {localizedLabel}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Section 2: Personal Information */}
                <div className="glass-panel p-6 sm:p-8 space-y-4">
                    <div className="flex items-center gap-2 text-base font-bold text-matte-dark border-b border-gray-200/60 pb-3">
                        <User size={18} className="text-fiery" />
                        <span>{t.settings.personalInfo.title}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                        <div>
                            <label className="block text-sm font-semibold text-matte-dark mb-1">
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
                            <label className="block text-sm font-semibold text-matte-dark mb-1">
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
                            <label className="block text-sm font-semibold text-matte-dark mb-1">
                                {t.settings.personalInfo.email}
                            </label>
                            <input
                                type="email"
                                disabled
                                className="input-glass bg-gray-100 text-gray-500 cursor-not-allowed"
                                value={user?.email || ''}
                            />
                            <p className="text-[11px] text-gray-400 mt-1">{t.settings.personalInfo.emailNotice}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-matte-dark mb-1">
                                {t.settings.personalInfo.role}
                            </label>
                            <input
                                type="text"
                                disabled
                                className="input-glass bg-gray-100 text-gray-500 cursor-not-allowed"
                                value={isUserAdmin ? t.settings.profileOverview.administrator : t.settings.profileOverview.standardUser}
                            />
                            <p className="text-[11px] text-gray-400 mt-1">{t.settings.personalInfo.roleNotice}</p>
                        </div>
                    </div>
                </div>

                {/* Section 3: App Theme Accent Color */}
                <div className="glass-panel p-6 sm:p-8 space-y-4">
                    <div className="flex items-center gap-2 text-base font-bold text-matte-dark border-b border-gray-200/60 pb-3">
                        <Palette size={18} className="text-fiery" />
                        <span>{t.settings.accentColor.title}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                        {t.settings.accentColor.subtitle}
                    </p>

                    <div className="flex flex-wrap gap-4 pt-2">
                        {Object.values(ACCENT_PALETTES).map((accent) => {
                            const isSelected = selectedAccent === accent.id;
                            const localizedName = (t.settings.accentColor.colors as Record<string, string>)[accent.id] || accent.label;
                            return (
                                <button
                                    key={accent.id}
                                    type="button"
                                    onClick={() => handleAccentSelect(accent.id)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 hover:scale-105 ${
                                        isSelected
                                            ? 'bg-white shadow-md border-gray-300 ring-2 ring-offset-2 ring-matte-dark'
                                            : 'bg-white/50 border-gray-200 hover:bg-white'
                                    }`}
                                >
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center transition-transform shadow-inner"
                                        style={{ backgroundColor: accent.primary }}
                                    >
                                        {isSelected && <Check size={16} className="text-white drop-shadow-md" />}
                                    </div>
                                    <div className="text-left">
                                        <div className="text-sm font-bold text-matte-dark">{localizedName}</div>
                                        <div className="text-[10px] text-gray-400 font-mono">{accent.primary}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Section 4: Interface Language */}
                <div className="glass-panel p-6 sm:p-8 space-y-4">
                    <div className="flex items-center gap-2 text-base font-bold text-matte-dark border-b border-gray-200/60 pb-3">
                        <Globe size={18} className="text-fiery" />
                        <span>{t.settings.languageSection.title}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                        {t.settings.languageSection.subtitle}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        {LANGUAGE_OPTIONS.map((lang) => {
                            const isSelected = selectedLanguage === lang.code;
                            return (
                                <button
                                    key={lang.code}
                                    type="button"
                                    onClick={() => setSelectedLanguage(lang.code as SupportedLanguage)}
                                    className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                                        isSelected
                                            ? 'bg-white shadow-md border-fiery ring-2 ring-fiery/30'
                                            : 'bg-white/50 border-gray-200 hover:bg-white'
                                    }`}
                                >
                                    <div>
                                        <div className="text-sm font-bold text-matte-dark">{lang.nativeName}</div>
                                        <div className="text-xs text-gray-400">{lang.label} ({lang.code.toUpperCase()})</div>
                                    </div>
                                    {isSelected && (
                                        <div className="w-6 h-6 rounded-full bg-fiery text-white flex items-center justify-center shadow">
                                            <Check size={14} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Section 5: Security / Change Password */}
                <div className="glass-panel p-6 sm:p-8 space-y-4">
                    <div className="flex items-center gap-2 text-base font-bold text-matte-dark border-b border-gray-200/60 pb-3">
                        <Lock size={18} className="text-fiery" />
                        <span>{t.settings.security.title}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                        {t.settings.security.subtitle}
                    </p>

                    <div className="space-y-4 pt-2">
                        <div>
                            <label className="block text-sm font-semibold text-matte-dark mb-1">
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
                                <label className="block text-sm font-semibold text-matte-dark mb-1">
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
                                <label className="block text-sm font-semibold text-matte-dark mb-1">
                                    {t.settings.security.confirmPassword}
                                </label>
                                <input
                                    type="password"
                                    className={"input-glass transition-colors duration-300 " + (
                                        newPassword && confirmPassword && newPassword === confirmPassword 
                                            ? 'border-green-500 ring-1 ring-green-500' 
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
                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-fiery flex items-center gap-2 px-6 py-3 text-base shadow-lg"
                    >
                        <Save size={18} />
                        <span>{isLoading ? t.common.saving : t.common.save}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
