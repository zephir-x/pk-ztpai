import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService } from '../api/projectService';
import { type ProjectResponse } from '../types/api';
import { ProjectModal } from '../components/modals/ProjectModal';
import { THEME_COLOR_MAP } from '../components/modals/WorkspaceModal';
import { Pagination } from '../components/Pagination';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { FolderKanban, Plus, Edit2, Trash2, Calendar, ArrowLeft, LayoutGrid } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function WorkspaceDetails() {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const { t } = useTranslation();

    usePageTitle(t.workspaceDetails.title);

    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editProject, setEditProject] = useState<ProjectResponse | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [animationDirection, setAnimationDirection] = useState<'right' | 'left'>('right');
    const PROJECTS_PER_PAGE = 6;

    useEffect(() => {
        if (workspaceId) {
            fetchProjects(workspaceId);
        }
    }, [workspaceId]);

    const fetchProjects = async (id: string) => {
        try {
            setIsLoading(true);
            const data = await projectService.getByWorkspace(id);
            setProjects(data);
        } catch {
            toast.error(t.workspaceDetails.fetchError);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProjectSaved = (project: ProjectResponse, isEdit: boolean) => {
        if (isEdit) {
            setProjects(prev => prev.map(p => p.id === project.id ? project : p));
        } else {
            setProjects(prev => [project, ...prev]);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(t.workspaceDetails.deleteConfirm)) return;
        try {
            await projectService.delete(id);
            setProjects(prev => prev.filter(p => p.id !== id));
            toast.success(t.workspaceDetails.deleteSuccess);
        } catch {
            toast.error(t.workspaceDetails.deleteError);
        }
    };

    const handlePageChange = (newPage: number, direction: 'left' | 'right') => {
        setAnimationDirection(direction);
        setCurrentPage(newPage);
    };

    // Calculate pagination slices
    const totalPages = Math.max(1, Math.ceil(projects.length / PROJECTS_PER_PAGE));
    const validCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (validCurrentPage - 1) * PROJECTS_PER_PAGE;
    const endIndex = Math.min(startIndex + PROJECTS_PER_PAGE, projects.length);
    const paginatedProjects = projects.slice(startIndex, endIndex);

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center p-12">
                <div className="glass-panel px-6 py-4 flex items-center gap-3 text-white border border-white/20 shadow-glass-md">
                    <div className="w-3.5 h-3.5 rounded-full bg-fiery animate-ping" />
                    <span className="text-sm font-semibold tracking-wide">{t.workspaceDetails.loading}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header Section: Vertically aligned with Dashboard and ProjectKanban */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7 relative z-10 shrink-0">
                <div>
                    {/* Back to Workspaces: Transparent, no glass box, bright white text */}
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white hover:text-fiery-light transition-colors mb-2.5 group cursor-pointer bg-transparent border-0 p-0 drop-shadow-md"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform text-fiery drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]" />
                        <span>{t.workspaceDetails.backButton}</span>
                    </button>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3 drop-shadow-md">
                        <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 shadow-glass-sm ring-1 ring-fiery/40">
                            <LayoutGrid className="text-fiery drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.7)]" size={26} />
                        </div>
                        <span>{t.workspaceDetails.title}</span>
                    </h2>
                    <p className="text-rain-200 text-sm mt-2 font-medium drop-shadow-sm">
                        {t.workspaceDetails.subtitle}
                    </p>
                </div>

                {isAdmin && (
                    <button
                        onClick={() => { setEditProject(null); setIsModalOpen(true); }}
                        className="btn-fiery flex items-center gap-2 self-start sm:mt-[26px] shadow-glow-accent px-6 py-3.5"
                    >
                        <Plus size={18} />
                        <span>{t.workspaceDetails.newProject}</span>
                    </button>
                )}
            </div>

            {/* Projects Grid */}
            {projects.length === 0 ? (
                <div className="flex-1 min-h-0 pt-8 pb-8 pr-1">
                    <div className="glass-panel p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-white/25 bg-rain-900/50 backdrop-blur-2xl">
                    <div className="p-4 rounded-2xl bg-white/10 border border-white/20 shadow-glass-sm mb-4">
                        <FolderKanban size={48} className="text-white/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                        {t.workspaceDetails.noProjects}
                    </h3>
                    <p className="text-white/80 max-w-xl text-sm leading-relaxed font-medium">
                        {t.workspaceDetails.noProjectsDesc}
                    </p>
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
                        {paginatedProjects.map((project) => {
                            const hexColor = THEME_COLOR_MAP[project.themeColor] || '#f97316';

                            return (
                                <div
                                    key={project.id}
                                    onClick={() => navigate('/projects/' + project.id, { state: { projectName: project.name, workspaceId: project.workspaceId } })}
                                    className="relative overflow-hidden p-6 pl-8 cursor-pointer group glass-card-unified border border-white/20 backdrop-blur-2xl rounded-2xl transition-all duration-150 ease-out hover:border-white/35 shadow-glass-sm flex flex-col justify-between"
                                >
                                    {/* GPU-accelerated colored ambient bloom layer on hover */}
                                    <div
                                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                                        style={{
                                            boxShadow: `inset 0 0 35px ${hexColor}25, 0 10px 30px -5px ${hexColor}35`
                                        }}
                                    />

                                    {/* Left vertical color ribbon matching theme */}
                                    <div
                                        className="absolute top-0 bottom-0 left-0 w-1.5 group-hover:w-2.5 transition-[width] duration-150 ease-out z-10"
                                        style={{
                                            backgroundColor: hexColor,
                                            boxShadow: `0 0 16px ${hexColor}`
                                        }}
                                    />

                                    <div>
                                        <div className="flex justify-between items-start mb-4 relative z-10">
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
                                                            setEditProject(project);
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="p-2 rounded-xl text-white/70 hover:text-white bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/25 transition-all cursor-pointer"
                                                        title={t.common.edit}
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(project.id, e)}
                                                        className="p-2 rounded-xl text-rose-300/80 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-400/20 hover:border-rose-400/40 transition-all cursor-pointer"
                                                        title={t.common.delete}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-fiery transition-colors relative z-10">
                                            {project.name}
                                        </h3>

                                        <p className="text-rain-200 text-sm mb-6 line-clamp-2 font-medium relative z-10">
                                            {project.description || t.workspaceDetails.noDescription}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-rain-200 pt-4 border-t border-white/10 relative z-10">
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full glass-card-unified border border-white/20 text-white/90 shadow-glass-sm">
                                            <Calendar size={13} className="text-fiery" />
                                            <span>
                                                {new Date(project.createdAt).toLocaleDateString()}
                                            </span>
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
                        totalItems={projects.length}
                        itemsPerPage={PROJECTS_PER_PAGE}
                        onPageChange={handlePageChange}
                        className="glass-panel border border-white/20 bg-rain-950/60 backdrop-blur-2xl rounded-2xl"
                        />
                    </div>
                </div>
            )}

            {/* Create/Edit Project Modal */}
            {workspaceId && (
                <ProjectModal
                    isOpen={isModalOpen}
                    workspaceId={workspaceId}
                    initialData={editProject}
                    onClose={() => setIsModalOpen(false)}
                    onSaved={handleProjectSaved}
                />
            )}
        </div>
    );
}
