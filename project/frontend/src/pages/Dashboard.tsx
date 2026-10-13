import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workspaceService } from '../api/workspaceService';
import { type WorkspaceResponse } from '../types/api';
import { WorkspaceModal, THEME_COLOR_MAP } from '../components/modals/WorkspaceModal';
import { Pagination } from '../components/Pagination';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { FolderKanban, Plus, LayoutDashboard, Edit2, Trash2, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
    const { t } = useTranslation();
    usePageTitle(t.dashboard.title);
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editWorkspace, setEditWorkspace] = useState<WorkspaceResponse | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [animationDirection, setAnimationDirection] = useState<'right' | 'left'>('right');
    const WORKSPACES_PER_PAGE = 6;

    // Fetch active workspaces on component mount
    useEffect(() => {
        fetchWorkspaces();
    }, []);

    const fetchWorkspaces = async () => {
        try {
            setIsLoading(true);
            const data = await workspaceService.getAll();
            setWorkspaces(data);
        } catch {
            toast.error(t.dashboard.fetchError);
        } finally {
            setIsLoading(false);
        }
    };

    const handleWorkspaceSaved = (workspace: WorkspaceResponse, isEdit: boolean) => {
        if (isEdit) {
            setWorkspaces(prev => prev.map(w => w.id === workspace.id ? workspace : w));
        } else {
            setWorkspaces(prev => [workspace, ...prev]);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t.dashboard.deleteConfirm)) return;
        try {
            await workspaceService.delete(id);
            setWorkspaces(prev => prev.filter(w => w.id !== id));
            toast.success(t.dashboard.deleteSuccess);
        } catch {
            toast.error(t.dashboard.deleteError);
        }
    };

    const handlePageChange = (newPage: number, direction: 'left' | 'right') => {
        setAnimationDirection(direction);
        setCurrentPage(newPage);
    };

    // Calculate pagination slices
    const totalPages = Math.max(1, Math.ceil(workspaces.length / WORKSPACES_PER_PAGE));
    const validCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (validCurrentPage - 1) * WORKSPACES_PER_PAGE;
    const endIndex = Math.min(startIndex + WORKSPACES_PER_PAGE, workspaces.length);
    const paginatedWorkspaces = workspaces.slice(startIndex, endIndex);

    // Render smooth pulsing skeleton during initial data fetch
    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center p-12">
                <div className="glass-panel px-6 py-4 flex items-center gap-3 text-white border border-white/20 shadow-glass-md">
                    <div className="w-3.5 h-3.5 rounded-full bg-fiery animate-ping" />
                    <span className="text-sm font-semibold tracking-wide">{t.dashboard.loading}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header Section lowered by pt-[26px] to vertically align with pages containing a back button */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7 relative z-10 pt-[26px] shrink-0">
                <div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3 drop-shadow-md">
                        <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 shadow-glass-sm ring-1 ring-fiery/40">
                            <LayoutDashboard className="text-fiery drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.7)]" size={26} />
                        </div>
                        <span>{t.dashboard.title}</span>
                    </h2>
                    <p className="text-rain-200 text-sm mt-2 font-medium drop-shadow-sm">
                        {t.dashboard.subtitle}
                    </p>
                </div>

                {isAdmin && (
                    <button
                        onClick={() => { setEditWorkspace(null); setIsModalOpen(true); }}
                        className="btn-fiery flex items-center gap-2 self-start shadow-glow-accent px-6 py-3.5"
                    >
                        <Plus size={18} />
                        <span>{t.dashboard.newWorkspace}</span>
                    </button>
                )}
            </div>

            {/* Workspaces Grid Area */}
            {workspaces.length === 0 ? (
                <div className="flex-1 min-h-0 pt-8 pb-8 pr-1">
                    <div className="glass-panel p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-white/25 bg-rain-900/50 backdrop-blur-2xl">
                    <div className="p-4 rounded-2xl bg-white/10 border border-white/20 shadow-glass-sm mb-4">
                        <FolderKanban size={48} className="text-white/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                        {t.dashboard.noWorkspaces}
                    </h3>
                    <p className="text-white/80 max-w-xl mb-6 text-sm leading-relaxed font-medium">
                        {t.dashboard.noWorkspacesDesc}
                    </p>
                    {isAdmin && (
                        <button
                            onClick={() => { setEditWorkspace(null); setIsModalOpen(true); }}
                            className="btn-fiery flex items-center gap-2"
                        >
                            <Plus size={18} />
                            <span>{t.dashboard.newWorkspace}</span>
                        </button>
                    )}
                </div>
                </div>
            ) : (
                <div className="flex-1 min-h-0 flex flex-col justify-between pt-8 pb-0">
                    <div
                        key={validCurrentPage}
                        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${
                            animationDirection === 'right' ? 'animate-slide-right' : 'animate-slide-left'
                        }`}
                    >
                        {paginatedWorkspaces.map((workspace) => {
                            const hexColor = THEME_COLOR_MAP[workspace.themeColor] || '#f97316';

                            return (
                                <div
                                    key={workspace.id}
                                    onClick={() => navigate('/workspace/' + workspace.id)}
                                    style={{
                                        '--workspace-glow': hexColor,
                                        '--workspace-glow-subtle': `${hexColor}25`,
                                    } as React.CSSProperties}
                                    className="group relative rounded-2xl border border-white/20 glass-card-unified backdrop-blur-2xl p-6 transition-all duration-150 ease-out hover:border-white/40 cursor-pointer shadow-glass-sm overflow-hidden"
                                >
                                    {/* Left vertical color ribbon matching theme */}
                                    <div
                                        className="absolute top-0 bottom-0 left-0 w-1.5 group-hover:w-2.5 transition-[width] duration-150 ease-out z-10"
                                        style={{
                                            backgroundColor: hexColor,
                                            boxShadow: `0 0 16px ${hexColor}`
                                        }}
                                    />

                                    {/* Ambient workspace glow on hover with dynamic ribbon color */}
                                    <div
                                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                                        style={{
                                            boxShadow: `inset 0 0 40px ${hexColor}22, 0 12px 35px -8px ${hexColor}35`
                                        }}
                                    />

                                    <div className="flex justify-between items-start mb-4 relative z-10 pl-2">
                                        <div className="p-3 rounded-xl bg-white/10 border border-white/20 shadow-glass-sm">
                                            <FolderKanban
                                                size={24}
                                                style={{ color: hexColor }}
                                                className="drop-shadow-[0_0_10px_currentColor]"
                                            />
                                        </div>

                                        {isAdmin && (
                                            <div className="flex items-center gap-1.5 relative z-20">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditWorkspace(workspace);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="p-2 rounded-xl text-white/70 hover:text-white bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/25 transition-all cursor-pointer"
                                                    title={t.common.edit}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(workspace.id);
                                                    }}
                                                    className="p-2 rounded-xl text-rose-300/80 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-400/20 hover:border-rose-400/40 transition-all cursor-pointer"
                                                    title={t.common.delete}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pl-2 relative z-10">
                                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-fiery transition-colors">
                                            {workspace.name}
                                        </h3>

                                        <div className="flex items-center gap-2 text-xs text-rain-200 mt-4">
                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full glass-card-unified border border-white/20 text-white/90 shadow-glass-sm">
                                                <Calendar size={13} className="text-fiery" />
                                                <span>
                                                    {new Date(workspace.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination Bar */}
                    <div className="pt-6 shrink-0">
                        <Pagination
                            currentPage={validCurrentPage}
                        totalPages={totalPages}
                        totalItems={workspaces.length}
                        itemsPerPage={WORKSPACES_PER_PAGE}
                        onPageChange={handlePageChange}
                        className="glass-panel border border-white/20 bg-rain-950/60 backdrop-blur-2xl rounded-2xl"
                        />
                    </div>
                </div>
            )}

            {/* Create/Edit Workspace Modal */}
            <WorkspaceModal
                isOpen={isModalOpen}
                initialData={editWorkspace}
                onClose={() => setIsModalOpen(false)}
                onSaved={handleWorkspaceSaved}
            />
        </div>
    );
}
