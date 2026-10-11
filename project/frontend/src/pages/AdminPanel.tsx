import { useEffect, useState } from 'react';
import { userService } from '../api/userService';
import { type UserResponse, UserRole } from '../types/api';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { Avatar } from '../components/Avatar';
import { Shield, Mail, UserCog, Edit2, Trash2 } from 'lucide-react';
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

    if (isLoading) return <div className="text-gray-500 animate-pulse p-8">{t.adminPanel.loading}</div>;

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-matte-dark flex items-center gap-2">
                        <Shield className="text-fiery" /> {t.adminPanel.title}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">{t.adminPanel.subtitle}</p>
                </div>
                <button onClick={() => { setEditUser(null); setIsModalOpen(true); }} className="btn-fiery">
                    {t.adminPanel.addUser}
                </button>
            </div>

            <div className="glass-panel overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-100/50 border-b border-gray-200">
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">#</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.adminPanel.emailAccount}</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.adminPanel.role}</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">{t.adminPanel.actions}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white/40">
                        {users.map((user, index) => {
                            const isSelf = user.id === currentAuthUser?.id;
                            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                            return (
                                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="p-4 font-mono text-sm text-gray-400 font-medium">
                                        {index + 1}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar avatarUrl={user.avatarUrl} name={fullName || user.email} size="sm" />
                                            <div className="min-w-0">
                                                {fullName && (
                                                    <div className="text-sm font-semibold text-matte-dark truncate">
                                                        {fullName}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <Mail size={12} className="text-gray-400 shrink-0" />
                                                    <span className="truncate">{user.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {(() => {
                                            const isAdmin = Number(user.role) === UserRole.Admin || user.role === 'Admin';
                                            const roleLabel = isAdmin ? t.common.admin : t.common.user;
                                            return (
                                                <span className={"inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold " + (isAdmin ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200')}>
                                                    {isAdmin && <UserCog size={12} />}
                                                    {roleLabel}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td className="p-4 text-right text-gray-400">
                                        {!isSelf ? (
                                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setEditUser(user); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-gray-100 rounded-lg transition-colors" title={t.common.edit}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(user.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-colors" title={t.common.delete}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 font-medium italic pr-2">
                                                {t.adminPanel.youBadge}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {users.length === 0 && (
                    <div className="p-8 text-center text-gray-500 text-sm">{t.adminPanel.noUsers}</div>
                )}
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
