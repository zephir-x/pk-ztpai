import { useState } from 'react';
import { X } from 'lucide-react';
import { projectService } from '../../api/projectService';
import { type ProjectResponse } from '../../types/api';
import { AxiosError } from 'axios';

interface CreateProjectModalProps {
    isOpen: boolean;
    workspaceId: string;
    onClose: () => void;
    onCreated: (newProject: ProjectResponse) => void;
}

export const CreateProjectModal = ({ isOpen, workspaceId, onClose, onCreated }: CreateProjectModalProps) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Prevent rendering when inactive to save resources
    if (!isOpen) return null;

    // Process form submission and trigger parent callback
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const newProject = await projectService.create(name, description || null, workspaceId);
            onCreated(newProject);
            // Reset state to ensure clean form on next open
            setName('');
            setDescription('');
            onClose();
        } catch (err) {
            if (err instanceof AxiosError && err.response?.data) {
                setError(err.response.data.message || 'Failed to create project.');
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Render modal overlay and structural wrapper
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-matte-dark/60 backdrop-blur-sm animate-fade-in">
            <div className="glass-panel w-full max-w-md p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-matte-dark transition-colors">
                    <X size={20} />
                </button>

                {/* Header Section */}
                <h3 className="text-xl font-bold text-matte-dark mb-4">Create New Project</h3>

                {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm border border-red-200">{error}</div>}

                {/* Project Creation Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-matte-dark mb-1">Project Name</label>
                        <input
                            type="text"
                            required
                            className="input-glass"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Website Redesign"
                            maxLength={100}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-matte-dark mb-1">Description <span className="text-gray-400 font-normal">(Optional)</span></label>
                        <textarea
                            className="input-glass min-h-[100px] resize-none"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief context about this project..."
                            maxLength={500}
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
                        <button type="submit" disabled={isLoading || !name.trim()} className="btn-fiery">
                            {isLoading ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
