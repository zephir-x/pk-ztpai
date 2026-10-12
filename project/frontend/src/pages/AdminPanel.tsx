import { useEffect, useState } from 'react';
import { userService } from '../api/userService';
import { stressTestService } from '../api/stressTestService';
import { type UserResponse, type StressTestStatusResponse, UserRole } from '../types/api';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { Avatar } from '../components/Avatar';
import { Pagination } from '../components/Pagination';
import { Shield, Mail, Edit2, Trash2, Plus, User, Database, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';
import { UserModal } from '../components/modals/UserModal';
import { toast } from 'react-hot-toast';

export default function AdminPanel() {
    const { t } = useTranslation();
    usePageTitle(t.adminPanel.title);
    const { user: currentAuthUser } = useAuth();
    const { fetchUnreadCount, fetchNotifications } = useNotifications();

    const [users, setUsers] = useState<UserResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editUser, setEditUser] = useState<UserResponse | null>(null);

    // Pagination state for users table
    const [currentPage, setCurrentPage] = useState(1);
    const [animationDirection, setAnimationDirection] = useState<'right' | 'left'>('right');
    const USERS_PER_PAGE = 8;

    // Stress testing state
    const [stressStatus, setStressStatus] = useState<StressTestStatusResponse | null>(null);
    const [isSeeding, setIsSeeding] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);

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
        fetchStressStatus();
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

    const fetchStressStatus = async () => {
        try {
            const data = await stressTestService.getStatus();
            setStressStatus(data);
        } catch {
            // Silently ignore or non-critical
        }
    };

    const handleSeedStress = async () => {
        try {
            setIsSeeding(true);
            const res = await stressTestService.seed();
            toast.success(res.message || t.adminPanel.stressTest.seedSuccess);
            await fetchUsers();
            await fetchStressStatus();
            await fetchUnreadCount();
            await fetchNotifications();
            setCurrentPage(1);
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.message || 'Failed to seed stress data.');
        } finally {
            setIsSeeding(false);
        }
    };

    const handleCleanupStress = async () => {
        if (!window.confirm(t.adminPanel.stressTest.confirmCleanup)) return;
        try {
            setIsCleaning(true);
            const res = await stressTestService.cleanup();
            toast.success(res.message || t.adminPanel.stressTest.cleanupSuccess);
            await fetchUsers();
            await fetchStressStatus();
            await fetchUnreadCount();
            await fetchNotifications();
            setCurrentPage(1);
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.message || 'Failed to cleanup stress data.');
        } finally {
            setIsCleaning(false);
        }
    };

    const handlePageChange = (newPage: number, direction: 'left' | 'right') => {
        setAnimationDirection(direction);
        setCurrentPage(newPage);
    };

    // Calculate pagination slices
    const totalPages = Math.max(1, Math.ceil(users.length / USERS_PER_PAGE));
    const validCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (validCurrentPage - 1) * USERS_PER_PAGE;
    const endIndex = Math.min(startIndex + USERS_PER_PAGE, users.length);
    const paginatedUsers = users.slice(startIndex, endIndex);

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
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7 relative z-10 pt-[26px] shrink-0">
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

            {/* Scrollable Container with Stationary Top and Bottom Fade Masks */}
            <div className="relative flex-1 min-h-0 [mask-image:linear-gradient(to_bottom,transparent_0px,black_32px,black_calc(100%-32px),transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0px,black_32px,black_calc(100%-32px),transparent_100%)]">
                <div className="h-full overflow-y-auto pt-8 pb-12 pr-1 space-y-8">
                    {/* Users Table Card */}
                    <div className="relative rounded-2xl border border-white/15 bg-rain-950/60 backdrop-blur-2xl shadow-none overflow-hidden">
                        {/* Top highlight laser rim */}
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse table-fixed">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/10">
                                        <th className="p-4 text-xs font-bold text-rain-300 uppercase tracking-wider w-14">#</th>
                                        <th className="p-4 text-xs font-bold text-rain-300 uppercase tracking-wider w-[34%]">{t.adminPanel.emailAccount}</th>
                                        <th className="p-4 text-xs font-bold text-rain-300 uppercase tracking-wider w-[26%]">{t.adminPanel.fullName}</th>
                                        <th className="p-4 text-xs font-bold text-rain-300 uppercase tracking-wider w-[22%]">{t.adminPanel.role}</th>
                                        <th className="p-4 text-xs font-bold text-rain-300 uppercase tracking-wider w-[18%] text-right">{t.adminPanel.actions}</th>
                                    </tr>
                                </thead>
                                <tbody
                                    key={validCurrentPage}
                                    className={`divide-y divide-white/10 ${
                                        animationDirection === 'right' ? 'animate-slide-right' : 'animate-slide-left'
                                    }`}
                                >
                                    {paginatedUsers.map((user, index) => {
                                        const isSelf = user.id === currentAuthUser?.id;
                                        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                                        const isUserAdmin = Number(user.role) === UserRole.Admin || user.role === 'Admin';
                                        const roleLabel = isUserAdmin ? t.common.admin : t.common.user;
                                        const globalIndex = startIndex + index + 1;

                                        return (
                                            <tr key={user.id} className="hover:bg-white/[0.04] transition-colors group">
                                                <td className="p-4 font-mono text-xs text-rain-400 font-medium">
                                                    {globalIndex}
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

                        {/* Pagination Bar with Directional Slide */}
                        <Pagination
                            currentPage={validCurrentPage}
                            totalPages={totalPages}
                            totalItems={users.length}
                            itemsPerPage={USERS_PER_PAGE}
                            onPageChange={handlePageChange}
                            label={t.adminPanel.pagination.showing(startIndex + 1, endIndex, users.length)}
                        />
                    </div>

                    {/* System Stress Testing & Diagnostics Card */}
                    <div className="relative rounded-2xl border border-white/15 bg-rain-950/60 backdrop-blur-2xl shadow-none p-6 sm:p-8 overflow-hidden">
                        {/* Top highlight laser rim */}
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-fiery/40 to-transparent pointer-events-none" />

                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            {/* Left Column: Information & Status */}
                            <div className="space-y-3 max-w-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-fiery/15 border border-fiery/30 shadow-[0_0_12px_rgba(var(--accent-rgb),0.3)]">
                                        <Database className="text-fiery" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2.5">
                                            <span>{t.adminPanel.stressTest.title}</span>
                                            {stressStatus?.isStressDataActive ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-fiery/20 text-fiery border border-fiery/40 shadow-glow-accent/30 animate-pulse">
                                                    <Zap size={11} />
                                                    <span>{t.adminPanel.stressTest.statusActive}</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                                    <CheckCircle2 size={11} />
                                                    <span>{t.adminPanel.stressTest.statusClean}</span>
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-rain-200 text-xs mt-1 leading-relaxed">
                                            {t.adminPanel.stressTest.subtitle}
                                        </p>
                                    </div>
                                </div>

                                {/* Database Counters Pills */}
                                {stressStatus && (
                                    <div className="flex flex-wrap items-center gap-2 pt-2">
                                        <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-rain-200 font-medium">
                                            <span className="text-white font-bold">{stressStatus.workspacesCount}</span> workspaces
                                        </div>
                                        <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-rain-200 font-medium">
                                            <span className="text-white font-bold">{stressStatus.projectsCount}</span> projects
                                        </div>
                                        <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-rain-200 font-medium">
                                            <span className="text-white font-bold">{stressStatus.tasksCount}</span> tasks
                                        </div>
                                        <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-rain-200 font-medium">
                                            <span className="text-white font-bold">{stressStatus.usersCount}</span> users
                                        </div>
                                        <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-rain-200 font-medium">
                                            <span className="text-white font-bold">{stressStatus.commentsCount}</span> comments
                                        </div>
                                        <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-rain-200 font-medium">
                                            <span className="text-white font-bold">{stressStatus.notificationsCount}</span> notifications
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Actions (mutually exclusive disabled states based on active dataset) */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                                <button
                                    onClick={handleSeedStress}
                                    disabled={isSeeding || isCleaning || Boolean(stressStatus?.isStressDataActive)}
                                    className="btn-fiery flex items-center justify-center gap-2 px-5 py-3 text-sm shadow-glow-accent cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <Zap size={16} className={isSeeding ? 'animate-bounce' : ''} />
                                    <span>{isSeeding ? t.adminPanel.stressTest.seeding : t.adminPanel.stressTest.seedBtn}</span>
                                </button>

                                <button
                                    onClick={handleCleanupStress}
                                    disabled={isSeeding || isCleaning || !stressStatus?.isStressDataActive}
                                    className="glass-btn-ghost flex items-center justify-center gap-2 px-5 py-3 text-sm text-rose-300 hover:text-rose-200 border-rose-500/30 hover:border-rose-400/60 hover:bg-rose-500/15 transition-all cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <RefreshCw size={15} className={isCleaning ? 'animate-spin' : ''} />
                                    <span>{isCleaning ? t.adminPanel.stressTest.cleaning : t.adminPanel.stressTest.cleanupBtn}</span>
                                </button>
                            </div>
                        </div>
                    </div>
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
