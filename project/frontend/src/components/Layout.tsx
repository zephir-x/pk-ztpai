import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { LayoutDashboard, CheckSquare, LogOut, Settings } from 'lucide-react';

export const Layout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { name: 'Workspaces', path: '/dashboard', icon: LayoutDashboard },
        { name: 'My Tasks', path: '/tasks', icon: CheckSquare },
        { name: 'Settings', path: '/settings', icon: Settings },
    ];

    const currentTabName = navItems.find(i => i.path === location.pathname)?.name || 'Dashboard';
    usePageTitle(currentTabName);

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Sidebar – dark, elegant matte */}
            <aside className="w-64 bg-spotlight text-white flex flex-col shadow-2xl z-20 border-r border-gray-800">
                <div className="p-6 flex items-center gap-3">
                    <img src="/logo.png" alt="Logo" className="w-9 h-auto drop-shadow-md" />
                    <span className="text-xl font-bold tracking-wide">ProjectHub</span>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.name}
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

                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Log out</span>
                    </button>
                </div>
            </aside>

            {/* Workspace (Light) */}
            <main className="flex-1 flex flex-col overflow-y-auto relative">
                <header className="h-16 border-b border-gray-200 bg-white/70 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
                    <h2 className="text-xl font-semibold text-matte-dark">
                        {currentTabName}
                    </h2>
                    <button className="btn-fiery flex items-center gap-2 text-sm">
                        <span className="text-lg leading-none">+</span> New Project
                    </button>
                </header>

                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
