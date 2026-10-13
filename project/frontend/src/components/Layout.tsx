import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { LayoutDashboard, CheckSquare, Bell, LogOut, Settings, Shield } from 'lucide-react';
import { Avatar } from './Avatar';

export const Layout = () => {
    const { isAdmin, user, profile, logout } = useAuth();
    const { unreadCount } = useNotifications();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    // Dynamically inject navigation tabs with notifications badge count
    const navItems = [
        ...(isAdmin ? [{ name: t.navigation.adminPanel, path: '/admin', icon: Shield }] : []),
        { name: t.navigation.dashboard, path: '/dashboard', icon: LayoutDashboard },
        { name: t.navigation.myTasks, path: '/tasks', icon: CheckSquare },
        { name: t.navigation.notifications, path: '/notifications', icon: Bell, badge: unreadCount },
        { name: t.navigation.settings, path: '/settings', icon: Settings }
    ];

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    const fullName = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim();
    const displayName = fullName || user?.email?.split('@')[0] || t.common.user;

    const isKanbanPage = location.pathname.startsWith('/projects/');

    return (
        <div className="flex h-screen overflow-hidden bg-glass-rain text-rain-100 relative selection:bg-fiery selection:text-white">
            {/* Ambient Misty Background Glows */}
            <div className="absolute top-1/4 left-1/3 w-[36rem] h-[36rem] bg-white/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[36rem] h-[36rem] bg-fiery/10 rounded-full blur-[150px] pointer-events-none animate-pulse-slow" />

            {/* Frosted Glass Sidebar with IDE-style Seam & Edge Bleed */}
            <aside className="w-64 glass-sidebar text-white flex flex-col h-screen shrink-0 z-20 relative">
                {/* Laser-cut top highlight */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                {/* JetBrains Rider-style right gradient divider seam */}
                <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-white/35 via-white/15 to-transparent pointer-events-none" />
                {/* Subtle soft gradient bleed smoothing transition into right viewport */}
                <div className="absolute -right-4 top-0 bottom-0 w-4 bg-gradient-to-r from-black/35 via-black/10 to-transparent pointer-events-none z-10" />
                {/* Luminous accent gleam at top of seam */}
                <div className="absolute top-0 -right-0.5 w-1.5 h-[210px] bg-gradient-to-b from-fiery/60 via-fiery/25 to-transparent blur-[2px] pointer-events-none" />

                {/* Brand Logo & Name */}
                <div className="p-6 flex items-center gap-3.5 shrink-0">
                    <div className="p-2 rounded-xl bg-white/10 border border-white/20 shadow-glass-sm shrink-0">
                        <img
                            src="/logo_white.png"
                            alt="Logo"
                            className="w-8 h-8 object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                        />
                    </div>
                    <span className="text-xl font-extrabold tracking-wide text-gradient-fiery drop-shadow-sm">
                        ProjectHub
                    </span>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`glass-nav-item ${
                                    isActive
                                        ? 'glass-nav-item-active'
                                        : 'glass-nav-item-inactive'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon
                                        size={20}
                                        className={isActive ? 'text-fiery drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]' : 'text-white/70'}
                                    />
                                    <span className="font-semibold text-sm tracking-wide">{item.name}</span>
                                </div>
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-fiery text-white shadow-[0_0_12px_rgba(var(--accent-rgb),0.65)] animate-pulse-slow">
                                        {item.badge > 99 ? '99+' : item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Profile card and spacious logout actions */}
                <div className="p-5 border-t border-white/15 space-y-3 shrink-0">
                    <Link
                        to="/settings"
                        className="flex items-center gap-3 p-3 rounded-2xl bg-white/8 hover:bg-white/15 border border-white/15 hover:border-white/30 transition-all duration-300 group shadow-glass-sm"
                        title={t.navigation.settings}
                    >
                        <Avatar
                            avatarUrl={profile?.avatarUrl || 'anonymous'}
                            name={displayName}
                            size="sm"
                        />
                        <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-bold text-white truncate group-hover:text-fiery transition-colors">
                                {displayName}
                            </p>
                            <p className="text-xs text-rain-200 truncate font-medium">
                                {isAdmin ? t.common.admin : t.common.user}
                            </p>
                        </div>
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2.5 px-4 py-3 w-full text-white/80 hover:text-white bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-400/40 rounded-xl transition-all duration-300 text-sm font-semibold hover:shadow-[0_0_18px_rgba(244,63,94,0.35)] active:scale-[0.98] cursor-pointer"
                    >
                        <LogOut size={18} className="text-rose-400" />
                        <span>{t.navigation.logout}</span>
                    </button>
                </div>
            </aside>

            {/* Workspace Viewport */}
            <main
                className={`flex-1 min-h-0 flex flex-col relative p-6 sm:p-8 z-10 ${
                    isKanbanPage ? 'overflow-hidden' : 'overflow-y-auto'
                }`}
            >
                {/* Ambient top horizontal atmospheric darkening vignette */}
                <div
                    className="absolute top-0 inset-x-0 h-[210px] pointer-events-none z-0"
                    style={{
                        background: 'linear-gradient(180deg, rgba(10, 14, 18, 0.96) 0%, rgba(10, 14, 18, 0.92) 55%, rgba(12, 18, 25, 0.45) 82%, transparent 100%)'
                    }}
                />

                <div key={location.pathname} className="animate-page-slide-in flex-1 min-h-0 flex flex-col relative z-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
