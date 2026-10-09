import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { projectService } from '../api/projectService';
import { type ProjectResponse } from '../types/api';
import { ProjectModal } from '../components/modals/ProjectModal';
import { THEME_COLOR_MAP } from '../components/modals/WorkspaceModal';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../context/AuthContext';
import { LayoutGrid, Plus, ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function WorkspaceDetails() {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    // Fallback to default name if accessed directly without router state
    const workspaceName = location.state?.workspaceName || 'Workspace';

    usePageTitle(workspaceName + ' Projects');

    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editProject, setEditProject] = useState<ProjectResponse | null>(null);

    // Fetch available projects on component mount
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
            toast.error('Failed to download projects.');
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
        if (!confirm('Are you sure you want to delete this project? This operation cannot be undone.')) return;
        try {
            await projectService.delete(id);
            setProjects(prev => prev.filter(p => p.id !== id));
            toast.success('The project has been deleted.');
        } catch {
            toast.error('Failed to delete the project.');
        }
    };

    // Prevent rendering board before data completes loading
    if (isLoading) return <div className="text-gray-500 animate-pulse p-8">Loading projects...</div>;

    return (
        <div>
            {/* Top Navigation */}
            <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-fiery transition-colors mb-6 font-medium"
            >
                <ArrowLeft size={16} />
                Back to Workspaces
            </button>

            {/* Header Section */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-matte-dark">{workspaceName}</h2>
                    <p className="text-gray-500 text-sm mt-1">Select a project to view its Kanban board</p>
                </div>
                {isAdmin && (
                    <button onClick={() => { setEditProject(null); setIsModalOpen(true); }} className="btn-fiery flex items-center gap-2">
                        <Plus size={18} />
                        <span>New Project</span>
                    </button>
                )}
            </div>

            {/* Projects Grid */}
            {projects.length === 0 ? (
                <div className="glass-panel p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-gray-300">
                    <LayoutGrid size={48} className="text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-matte-dark mb-2">No projects found</h3>
                    <p className="text-gray-500 max-w-md">This workspace is currently empty.</p>
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
                            <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                                {project.description || 'No description provided.'}
                            </p>
                            <div className="text-xs font-medium text-gray-400">
                                Opened {new Date(project.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            {workspaceId && isAdmin && (
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
