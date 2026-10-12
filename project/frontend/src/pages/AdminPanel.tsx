import { useEffect, useState } from 'react';
import { userService } from '../api/userService';
import { type UserResponse, UserRole } from '../types/api';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { Avatar } from '../components/Avatar';
import { Shield, Mail, Edit2, Trash2, Plus, User } from 'lucide-react';
import { UserModal } from '../components/modals/UserModal';
import { toast } from 'react-hot-toast';

export default function AdminPanel() {
    const { t } = useTranslation();
    usePageTitle(t.adminPanel.title);
    const { user: currentAuthUser } = useAuth();

    const [users, setUsers] = useState<UserResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editUser, setEditUser] = useState<UserResponse | null>(null);

    const handleUserSaved = (user: UserResponse, isEdit: boolean) => {
        if (isEdit) {
            setUsers(prev => prev.map(u => u.id === user.id ? user : u));
        } else {
            setUsers(prev => [user, ...prev]);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm(t.adminPanel.deleteConfirm)) return;
        try {
            await userService.delete(id);
            setUsers(prev => prev.filter(u => u.id !== id));
            toast.success(t.adminPanel.deleteSuccess);
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.response?.data?.detail || t.adminPanel.deleteError);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const data = await userService.getAll();
            setUsers(data);
        } catch {
            toast.error(t.adminPanel.loading);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center p-12">
                <div className="glass-panel px-6 py-4 flex items-center gap-3 text-white border border-white/20 shadow-glass-md">
                    <div className="w-3.5 h-3.5 rounded-full bg-fiery animate-ping" />
                    <span className="text-sm font-semibold tracking-wide">{t.adminPanel.loading}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header Section: lowered by pt-[26px] to vertically align across all application pages */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 relative z-10 pt-[26px]">
                <div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3 drop-shadow-md">
                        <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 shadow-glass-sm ring-1 ring-fiery/40">
                            <Shield className="text-fiery drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.7)]" size={26} />
                        </div>
                        <span>{t.adminPanel.title}</span>
                    </h2>
                    <p className="text-rain-200 text-sm mt-2 font-medium drop-shadow-sm">
                        {t.adminPanel.subtitle}
                    </p>
                </div>
                <button
                    onClick={() => { setEditUser(null); setIsModalOpen(true); }}
                    className="btn-fiery flex items-center gap-2 self-start shadow-glow-accent px-6 py-3.5"
                >
                    <Plus size={18} />
                    <span>{t.adminPanel.addUser}</span>
                </button>
            </div>

            {/* Users Table Card */}
            <div className="flex-1 overflow-y-auto pb-8 pr-1">
                <div className="glass-panel relative rounded-2xl border border-white/20 bg-rain-950/60 backdrop-blur-2xl shadow-glass-sm overflow-hidden">
                    {/* Top highlight laser rim */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10">
                                    <th className="p-4 text-xs font-bold text-rain-300 uppercase tracking-wider w-16">#</th>
                                    <th className="p-4 text-xs font-bold text-rain-300 uppercase tracking-wider">{t.adminPanel.emailAccount}</th>
                                    <th className="p-4 text-xs font-bold text-rain-300 uppercase tracking-wider">{t.adminPanel.fullName}</th>
                                    <th className="p-4 text-xs font-bold text-rain-300 uppercase tracking-wider">{t.adminPanel.role}</th>
                                    <th className="p-4 text-xs font-bold text-rain-300 uppercase tracking-wider text-right">{t.adminPanel.actions}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {users.map((user, index) => {
                                    const isSelf = user.id === currentAuthUser?.id;
                                    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                                    const isUserAdmin = Number(user.role) === UserRole.Admin || user.role === 'Admin';
                                    const roleLabel = isUserAdmin ? t.common.admin : t.common.user;

                                    return (
                                        <tr key={user.id} className="hover:bg-white/[0.04] transition-colors group">
                                            <td className="p-4 font-mono text-xs text-rain-400 font-medium">
                                                {index + 1}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar avatarUrl={user.avatarUrl} name={fullName || user.email} size="sm" />
                                                    <div className="flex items-center gap-1.5 text-xs text-white/90 font-medium">
                                                        <Mail size={12} className="text-rain-300 shrink-0" />
                                                        <span className="truncate">{user.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {fullName ? (
                                                    <span className="text-sm font-semibold text-white drop-shadow-sm">
                                                        {fullName}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-rain-400 italic font-medium">
                                                        {t.adminPanel.notSpecified}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {isUserAdmin ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-fiery/15 text-fiery border border-fiery/30 shadow-[0_0_12px_rgba(var(--accent-rgb),0.25)]">
                                                        <Shield size={12} />
                                                        <span>{roleLabel}</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/90 border border-white/15">
                                                        <User size={12} />
                                                        <span>{roleLabel}</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                {!isSelf ? (
                                                    <div className="flex gap-1.5 justify-end opacity-80 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => { setEditUser(user); setIsModalOpen(true); }}
                                                            className="p-2 text-rain-300 hover:text-white hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/25 transition-all cursor-pointer"
                                                            title={t.common.edit}
                                                        >
                                                            <Edit2 size={15} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(user.id)}
                                                            className="p-2 text-rain-300 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-white/10 hover:border-rose-400/25 transition-all cursor-pointer"
                                                            title={t.common.delete}
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-rain-300 font-medium italic pr-2">
                                                        {t.adminPanel.youBadge}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {users.length === 0 && (
                        <div className="p-12 text-center text-rain-300 text-sm font-medium">
                            {t.adminPanel.noUsers}
                        </div>
                    )}
                </div>
            </div>

            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={handleUserSaved}
                initialData={editUser}
            />
        </div>
    );
}
