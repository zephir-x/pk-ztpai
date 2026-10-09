import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workspaceService } from '../api/workspaceService';
import { type WorkspaceResponse } from '../types/api';
import { WorkspaceModal, THEME_COLOR_MAP } from '../components/modals/WorkspaceModal';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../context/AuthContext';
import { FolderKanban, Plus, LayoutDashboard, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
    usePageTitle('Dashboard');
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editWorkspace, setEditWorkspace] = useState<WorkspaceResponse | null>(null);

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
            toast.error('Failed to retrieve workspaces.');
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
        if (!confirm('Are you sure you want to delete this workspace? This operation cannot be undone.')) return;
        try {
            await workspaceService.delete(id);
            setWorkspaces(prev => prev.filter(w => w.id !== id));
            toast.success('The workspace has been deleted.');
        } catch {
            toast.error('Failed to remove the workspace.');
        }
    };

    // Prevent rendering board before data completes loading
    if (isLoading) return <div className="text-gray-500 animate-pulse p-8">Loading workspaces...</div>;

    return (
        <div className="h-full flex flex-col">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-matte-dark flex items-center gap-2">
                        <LayoutDashboard className="text-fiery" /> Workspaces
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Manage your team environments</p>
                </div>
                {isAdmin && (
                    <button onClick={() => setIsModalOpen(true)} className="btn-fiery flex items-center gap-2">
                        <Plus size={18} />
                        <span>New Workspace</span>
                    </button>
                )}
            </div>

            {/* Workspaces Grid */}
            {workspaces.length === 0 ? (
                <div className="glass-panel p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-gray-300">
                    <FolderKanban size={48} className="text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-matte-dark mb-2">No workspaces found</h3>
                    <p className="text-gray-500 max-w-md mb-6">You don't have access to any workspaces yet.</p>
                    {isAdmin && (
                        <button onClick={() => { setEditWorkspace(null); setIsModalOpen(true); }} className="btn-fiery">Create Workspace</button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workspaces.map((ws) => (
                        <div
                            key={ws.id}
                            onClick={() => navigate('/workspace/' + ws.id, { state: { workspaceName: ws.name } })}
                            className="glass-panel relative overflow-hidden p-6 pl-8 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300" style={{ backgroundColor: THEME_COLOR_MAP[ws.themeColor] }}></div>
                            
                            {isAdmin && (
                                <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-3">
                                    <button onClick={(e) => { e.stopPropagation(); setEditWorkspace(ws); setIsModalOpen(true); }} className="text-gray-400 hover:text-blue-500 transition-colors">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(ws.id); }} className="text-gray-400 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                            <h3 className="text-lg font-semibold text-matte-dark mb-1 group-hover:text-fiery transition-colors">{ws.name}</h3>
                            <p className="text-xs text-gray-400">Created on {new Date(ws.createdAt).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            {isAdmin && (
                <WorkspaceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSaved={handleWorkspaceSaved} initialData={editWorkspace} />
            )}
        </div>
    );
}
