import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { userService } from '../../api/userService';
import { type UserResponse, UserRole } from '../../types/api';
import { Avatar } from '../Avatar';
import { AVATAR_PRESETS } from '../../constants/theme';
import { useTranslation } from '../../context/LanguageContext';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: (user: UserResponse, isEdit: boolean) => void;
    initialData?: UserResponse | null;
}

export const UserModal = ({ isOpen, onClose, onSaved, initialData }: UserModalProps) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('anonymous');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.User);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setEmail(initialData?.email || '');
            setFirstName(initialData?.firstName || '');
            setLastName(initialData?.lastName || '');
            setSelectedAvatar(initialData?.avatarUrl || 'anonymous');
            setPassword(''); // Never pre-fill password for security
            setConfirmPassword('');

            // Map string 'Admin' or 'User' from backend to Enum if needed
            let parsedRole: UserRole = UserRole.User;
            if (initialData?.role === 'Admin' || initialData?.role === UserRole.Admin) {
                parsedRole = UserRole.Admin;
            }
            setRole(parsedRole);

            setError(null);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password && password !== confirmPassword) {
            setError(t.modals.user.passwordsMismatch);
            return;
        }

        setIsLoading(true);

        try {
            if (initialData) {
                // Update User (email is immutable)
                const updateData = {
                    email: initialData.email,
                    role,
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    avatarUrl: selectedAvatar,
                    password: password || undefined
                };
                await userService.update(initialData.id, updateData as any);
                onSaved({
                    ...initialData,
                    role: role === UserRole.Admin ? 'Admin' : 'User',
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    avatarUrl: selectedAvatar
                }, true);
                toast.success(t.modals.user.updateSuccess);
            } else {
                // Create User
                if (!password) {
                    setError(t.modals.user.passwordRequired);
                    setIsLoading(false);
                    return;
                }
                const createData = {
                    email: email.trim(),
                    role,
                    password,
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    avatarUrl: selectedAvatar
                };
                const newUser = await userService.create(createData as any);
                onSaved(newUser, false);
                toast.success(t.modals.user.createSuccess);
            }
            onClose();
        } catch (err) {
            if (err instanceof AxiosError && err.response?.data) {
                const data = err.response.data;
                if (data.errors) {
                    const errorList = Object.values(data.errors).flat() as string[];
                    setError(errorList[0] || t.adminPanel.deleteError);
                } else {
                    setError(data.message || data.detail || t.adminPanel.deleteError);
                }
            } else {
                setError(t.modals.taskDetails.apiErrors.serverError);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md animate-fade-in p-4 sm:p-6 overflow-y-auto">
            <div className="glass-panel-elevated animate-modal-enter w-full max-w-lg p-6 sm:p-7 relative bg-rain-900/95 backdrop-blur-3xl border border-white/25 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Laser top highlight */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                {/* Robust Header with Title & Non-overlapping Close Button */}
                <div className="flex items-center justify-between mb-5 relative z-20 shrink-0">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-sm">
                        {initialData ? t.modals.user.editTitle : t.modals.user.createTitle}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl text-rain-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                        title={t.common.cancel}
                    >
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/20 text-red-100 border border-red-400/40 px-4 py-2.5 rounded-xl mb-4 text-xs shadow-glow-crimson/20 backdrop-blur-md shrink-0">
                        {error}
                    </div>
                )}

                {/* Scrollable Form Body */}
                <div className="flex-1 overflow-y-auto pr-1">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Avatar Preset Selector - Centered to match workspace / task color ribbons */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-rain-200 mb-2 text-center sm:text-left">
                                {t.modals.user.avatarLabel}
                            </label>
                            <div className="flex flex-wrap justify-center gap-2.5 py-1">
                                {AVATAR_PRESETS.map((preset) => {
                                    const isSelected = selectedAvatar === preset.id;
                                    const avatarLabel = t.settings.avatarSection.avatars[preset.id] || preset.label;
                                    return (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => setSelectedAvatar(preset.id)}
                                            className={`relative p-1.5 rounded-2xl transition-all duration-200 hover:scale-105 cursor-pointer ${
                                                isSelected
                                                    ? 'bg-fiery/20 ring-2 ring-fiery border border-fiery/50 shadow-glow-accent/30 scale-105'
                                                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                            }`}
                                            title={avatarLabel}
                                        >
                                            <Avatar avatarUrl={preset.id} name={avatarLabel} size="sm" />
                                            {isSelected && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-fiery text-white flex items-center justify-center shadow-md">
                                                    <Check size={10} strokeWidth={3} />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* First & Last Name */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-rain-200 mb-1.5">
                                    {t.modals.user.firstNameLabel}
                                </label>
                                <input
                                    type="text"
                                    className="input-glass"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder={t.modals.user.firstNamePlaceholder}
                                    maxLength={50}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-rain-200 mb-1.5">
                                    {t.modals.user.lastNameLabel}
                                </label>
                                <input
                                    type="text"
                                    className="input-glass"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder={t.modals.user.lastNamePlaceholder}
                                    maxLength={50}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-rain-200 mb-1.5">
                                {t.modals.user.emailLabel}
                            </label>
                            <input
                                type="email"
                                required
                                disabled={!!initialData}
                                className={`input-glass ${initialData ? 'opacity-60 cursor-not-allowed bg-rain-950/60' : ''}`}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t.modals.user.emailPlaceholder}
                            />
                            {initialData && (
                                <p className="text-[11px] text-rain-300 mt-1">{t.modals.user.emailImmutableNotice}</p>
                            )}
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-rain-200 mb-1.5">
                                {t.modals.user.roleLabel}
                            </label>
                            <select
                                className="input-glass cursor-pointer bg-rain-950 text-white"
                                value={role}
                                onChange={(e) => setRole(parseInt(e.target.value) as UserRole)}
                            >
                                <option value={UserRole.User} className="bg-rain-900 text-white">{t.common.user}</option>
                                <option value={UserRole.Admin} className="bg-rain-900 text-white">{t.common.admin}</option>
                            </select>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-rain-200 mb-1.5">
                                {initialData ? t.modals.user.newPasswordLabel : t.modals.user.passwordLabel}
                            </label>
                            <input
                                type="password"
                                className="input-glass"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={initialData ? t.modals.user.passwordEditPlaceholder : t.modals.user.passwordCreatePlaceholder}
                            />
                            {initialData && <p className="text-xs text-rain-300 mt-1">{t.modals.user.newPasswordNotice}</p>}
                        </div>

                        {/* Confirm Password Field */}
                        {(!initialData || password.length > 0) && (
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-rain-200 mb-1.5">
                                    {t.modals.user.confirmPasswordLabel}
                                </label>
                                <input
                                    type="password"
                                    required={!initialData || password.length > 0}
                                    className={"input-glass transition-colors duration-300 " + (
                                        password && confirmPassword && password === confirmPassword
                                            ? 'border-emerald-500 ring-1 ring-emerald-500'
                                            : (password && confirmPassword && password !== confirmPassword ? 'border-red-500 ring-1 ring-red-500' : '')
                                    )}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
                        )}

                        {/* Modal Action Buttons */}
                        <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-white/10">
                            <button
                                type="button"
                                onClick={onClose}
                                className="glass-btn-ghost text-sm px-5 py-2.5 cursor-pointer"
                            >
                                <span>{t.common.cancel}</span>
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || (!initialData && !email.trim())}
                                className="btn-fiery text-sm px-6 py-2.5 cursor-pointer disabled:opacity-50"
                            >
                                <span>
                                    {isLoading ? t.common.saving : (initialData ? t.common.save : t.common.create)}
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
