import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { LayoutDashboard, CheckSquare, LogOut, Settings, Shield } from 'lucide-react';
import { Avatar } from './Avatar';

export const Layout = () => {
    const { isAdmin, user, profile, logout } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    // Dynamically inject Admin Panel if the user has the ADMIN role
    const navItems = [
        ...(isAdmin ? [{ name: t.navigation.adminPanel, path: '/admin', icon: Shield }] : []),
        { name: t.navigation.dashboard, path: '/dashboard', icon: LayoutDashboard },
        { name: t.navigation.myTasks, path: '/tasks', icon: CheckSquare },
        { name: t.navigation.settings, path: '/settings', icon: Settings }
    ];

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    const fullName = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim();
    const displayName = fullName || user?.email?.split('@')[0] || t.common.user;

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-spotlight text-white flex flex-col h-screen shrink-0 shadow-2xl z-20 border-r border-gray-800">
                <div className="p-6 flex items-center gap-3 shrink-0">
                    <img src="/logo.png" alt="Logo" className="w-12 h-auto drop-shadow-md invert brightness-0 opacity-90" />
                    <span className="text-xl font-extrabold tracking-wide text-fiery">ProjectHub</span>
                </div>

                <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                                    isActive
                                        ? 'bg-gray-800/50 text-fiery-light border-l-2 border-fiery shadow-inner'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`}
                            >
                                <Icon size={20} className={isActive ? 'text-fiery' : ''} />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Profile card and logout actions */}
                <div className="p-4 border-t border-gray-800 space-y-2 shrink-0">
                    <Link
                        to="/settings"
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/80 transition-colors group"
                        title={t.navigation.settings}
                    >
                        <Avatar
                            avatarUrl={profile?.avatarUrl || 'anonymous'}
                            name={displayName}
                            size="sm"
                        />
                        <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-semibold text-white truncate group-hover:text-fiery transition-colors">
                                {displayName}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">
                                {isAdmin ? t.common.admin : t.common.user}
                            </p>
                        </div>
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 w-full text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors text-sm"
                    >
                        <LogOut size={18} />
                        <span className="font-medium">{t.navigation.logout}</span>
                    </button>
                </div>
            </aside>

            {/* Workspace */}
            <main className="flex-1 flex flex-col overflow-y-auto relative p-8">
                <Outlet />
            </main>
        </div>
    );
};
