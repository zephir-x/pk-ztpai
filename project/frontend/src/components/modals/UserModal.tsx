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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-matte-dark/60 backdrop-blur-sm animate-fade-in p-4 overflow-y-auto">
            <div className="glass-panel w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-matte-dark transition-colors"
                >
                    <X size={20} />
                </button>

                <h3 className="text-xl font-bold text-matte-dark mb-4">
                    {initialData ? t.modals.user.editTitle : t.modals.user.createTitle}
                </h3>

                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm border border-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Avatar Preset Selector */}
                    <div>
                        <label className="block text-sm font-semibold text-matte-dark mb-2">{t.modals.user.avatarLabel}</label>
                        <div className="flex flex-wrap gap-2.5">
                            {AVATAR_PRESETS.map((preset) => {
                                const isSelected = selectedAvatar === preset.id;
                                const avatarLabel = t.settings.avatarSection.avatars[preset.id] || preset.label;
                                return (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => setSelectedAvatar(preset.id)}
                                        className={`relative p-1.5 rounded-xl transition-all duration-200 hover:scale-105 ${
                                            isSelected ? 'bg-gray-100 ring-2 ring-offset-1 ring-matte-dark' : 'hover:bg-gray-50'
                                        }`}
                                        title={avatarLabel}
                                    >
                                        <Avatar avatarUrl={preset.id} name={avatarLabel} size="sm" />
                                        {isSelected && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-matte-dark text-white flex items-center justify-center shadow">
                                                <Check size={10} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* First & Last Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold text-matte-dark mb-1">{t.modals.user.firstNameLabel}</label>
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
                            <label className="block text-sm font-semibold text-matte-dark mb-1">{t.modals.user.lastNameLabel}</label>
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

                    {/* Email Address - immutable on edit */}
                    <div>
                        <label className="block text-sm font-semibold text-matte-dark mb-1">{t.modals.user.emailLabel}</label>
                        <input
                            type="email"
                            required
                            disabled={!!initialData}
                            className={`input-glass ${initialData ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t.modals.user.emailPlaceholder}
                        />
                        {initialData && (
                            <p className="text-[11px] text-gray-400 mt-1">{t.modals.user.emailImmutableNotice}</p>
                        )}
                    </div>
                    
                    {/* Role */}
                    <div>
                        <label className="block text-sm font-semibold text-matte-dark mb-1">{t.modals.user.roleLabel}</label>
                        <select
                            className="input-glass bg-white"
                            value={role}
                            onChange={(e) => setRole(parseInt(e.target.value) as UserRole)}
                        >
                            <option value={UserRole.User}>{t.common.user}</option>
                            <option value={UserRole.Admin}>{t.common.admin}</option>
                        </select>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-semibold text-matte-dark mb-1">
                            {initialData ? t.modals.user.newPasswordLabel : t.modals.user.passwordLabel}
                        </label>
                        <input
                            type="password"
                            className="input-glass"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={initialData ? t.modals.user.passwordEditPlaceholder : t.modals.user.passwordCreatePlaceholder}
                        />
                        {initialData && <p className="text-xs text-gray-400 mt-1">{t.modals.user.newPasswordNotice}</p>}
                    </div>

                    {/* Confirm Password Field - unified border highlighting */}
                    {(!initialData || password.length > 0) && (
                        <div>
                            <label className="block text-sm font-semibold text-matte-dark mb-1">{t.modals.user.confirmPasswordLabel}</label>
                            <input
                                type="password"
                                required={!initialData || password.length > 0}
                                className={"input-glass transition-colors duration-300 " + (
                                    password && confirmPassword && password === confirmPassword 
                                        ? 'border-green-500 ring-1 ring-green-500' 
                                        : (password && confirmPassword && password !== confirmPassword ? 'border-red-500 ring-1 ring-red-500' : '')
                                )}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            {t.common.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || (!initialData && !email.trim())}
                            className="btn-fiery"
                        >
                            {isLoading ? t.common.saving : (initialData ? t.common.save : t.common.create)}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
