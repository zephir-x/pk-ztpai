import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workspaceService } from '../api/workspaceService';
import { type WorkspaceResponse } from '../types/api';
import { CreateWorkspaceModal } from '../components/modals/CreateWorkspaceModal';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../context/AuthContext';
import { FolderKanban, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
    usePageTitle('Workspaces');
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
            toast.error('Nie uda�o si� pobra� przestrzeni roboczych.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleWorkspaceCreated = (newWorkspace: WorkspaceResponse) => {
        setWorkspaces(prev => [newWorkspace, ...prev]);
    };

    // Prevent rendering board before data completes loading
    if (isLoading) return <div className="text-gray-500 animate-pulse p-8">Loading workspaces...</div>;

    return (
        <div className="h-full flex flex-col">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-matte-dark">Workspaces</h2>
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
                        <button onClick={() => setIsModalOpen(true)} className="btn-fiery">Create Workspace</button>
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
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gray-400 group-hover:bg-fiery transition-colors duration-300"></div>
                            <h3 className="text-lg font-semibold text-matte-dark mb-1 group-hover:text-fiery transition-colors">{ws.name}</h3>
                            <p className="text-xs text-gray-400">Created on {new Date(ws.createdAt).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            {isAdmin && (
                <CreateWorkspaceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={handleWorkspaceCreated} />
            )}
        </div>
    );
}
