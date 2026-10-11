import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService } from '../api/projectService';
import { type ProjectResponse } from '../types/api';
import { ProjectModal } from '../components/modals/ProjectModal';
import { THEME_COLOR_MAP } from '../components/modals/WorkspaceModal';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { LayoutGrid, Plus, ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function WorkspaceDetails() {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const { t } = useTranslation();
    usePageTitle(t.workspaceDetails.pageTitle);

    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editProject, setEditProject] = useState<ProjectResponse | null>(null);

    // Fetch projects scoped to current workspace
    useEffect(() => {
        if (workspaceId) {
            fetchProjects(workspaceId);
        }
    }, [workspaceId]);

    const fetchProjects = async (wsId: string) => {
        try {
            setIsLoading(true);
            const data = await projectService.getByWorkspace(wsId);
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

    const handleDelete = async (id: string) => {
        if (!confirm(t.workspaceDetails.deleteConfirm)) return;
        try {
            await projectService.delete(id);
            setProjects(prev => prev.filter(p => p.id !== id));
            toast.success(t.workspaceDetails.deleteSuccess);
        } catch {
            toast.error(t.workspaceDetails.deleteError);
        }
    };

    // Prevent rendering board before data completes loading
    if (isLoading) return <div className="text-gray-500 animate-pulse p-8">{t.workspaceDetails.loading}</div>;

    return (
        <div className="h-full flex flex-col">
            {/* Top Navigation */}
            <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-fiery transition-colors mb-6 font-medium"
            >
                <ArrowLeft size={16} />
                {t.workspaceDetails.backButton}
            </button>

            {/* Header Section */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-matte-dark flex items-center gap-2">
                        <LayoutGrid className="text-fiery" /> {t.workspaceDetails.title}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">{t.workspaceDetails.subtitle}</p>
                </div>

                {isAdmin && (
                    <button onClick={() => { setEditProject(null); setIsModalOpen(true); }} className="btn-fiery flex items-center gap-2">
                        <Plus size={18} />
                        <span>{t.workspaceDetails.newProject}</span>
                    </button>
                )}
            </div>

            {/* Projects Grid */}
            {projects.length === 0 ? (
                <div className="glass-panel p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-gray-300">
                    <LayoutGrid size={48} className="text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-matte-dark mb-2">{t.workspaceDetails.noProjects}</h3>
                    <p className="text-gray-500 max-w-2xl">{t.workspaceDetails.noProjectsDesc}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            onClick={() => navigate('/projects/' + project.id, { state: { projectName: project.name, workspaceId: project.workspaceId } })}
                            className="glass-panel relative overflow-hidden p-6 pl-8 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300" style={{ backgroundColor: THEME_COLOR_MAP[project.themeColor] }}></div>
                            <h3 className="text-lg font-semibold text-matte-dark mb-2 group-hover:text-fiery transition-colors pr-12">{project.name}</h3>
                            {isAdmin && (
                                <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-3">
                                    <button onClick={(e) => { e.stopPropagation(); setEditProject(project); setIsModalOpen(true); }} className="text-gray-400 hover:text-blue-500 transition-colors">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }} className="text-gray-400 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{project.description || t.workspaceDetails.noDescription}</p>
                            <p className="text-xs text-gray-400">{t.workspaceDetails.createdOn} {new Date(project.createdAt).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            {isAdmin && workspaceId && (
                <ProjectModal
                    isOpen={isModalOpen}
                    workspaceId={workspaceId}
                    onClose={() => setIsModalOpen(false)}
                    onSaved={handleProjectSaved}
                    initialData={editProject}
                />
            )}
        </div>
    );
}
