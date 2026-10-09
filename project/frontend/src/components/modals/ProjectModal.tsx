import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { projectService } from '../../api/projectService';
import { type ProjectResponse, ThemeColor } from '../../types/api';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { THEME_COLOR_MAP } from './WorkspaceModal';

const THEME_COLORS = Object.values(ThemeColor).filter(val => typeof val === 'number') as ThemeColor[];

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: (project: ProjectResponse, isEdit: boolean) => void;
    workspaceId: string;
    initialData?: ProjectResponse | null;
}

export const ProjectModal = ({ isOpen, onClose, onSaved, workspaceId, initialData }: ProjectModalProps) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [themeColor, setThemeColor] = useState<ThemeColor>(ThemeColor.Blue);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(initialData?.name || '');
            setDescription(initialData?.description || '');
            setThemeColor(initialData?.themeColor ?? ThemeColor.Blue);
            setError(null);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (initialData) {
                await projectService.update(initialData.id, name, description || null, themeColor);
                onSaved({ ...initialData, name, description: description || null, themeColor }, true);
                toast.success('The project has been updated.');
            } else {
                const newProject = await projectService.create(name, description || null, themeColor, workspaceId);
                onSaved(newProject, false);
                toast.success('The project has been successfully created.');
            }
            onClose();
        } catch (err) {
            if (err instanceof AxiosError && err.response?.data) {
                const data = err.response.data;
                if (data.errors) {
                    setError(Object.values(data.errors).flat().join(' '));
                } else {
                    setError(data.message || 'A write error occurred.');
                }
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-matte-dark/60 backdrop-blur-sm animate-fade-in">
            <div className="glass-panel w-full max-w-md p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-matte-dark transition-colors"
                >
                    <X size={20} />
                </button>

                <h3 className="text-xl font-bold text-matte-dark mb-4">
                    {initialData ? 'Edit Project' : 'Create New Project'}
                </h3>

                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm border border-red-200">
                        {error}
                    </div>
                )}

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
                        <label className="block text-sm font-semibold text-matte-dark mb-1">Description (Optional)</label>
                        <textarea
                            className="input-glass resize-none"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Briefly describe the project..."
                            rows={3}
                            maxLength={500}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-matte-dark mb-2">Theme Color</label>
                        <div className="flex gap-3">
                            {THEME_COLORS.map(colorEnum => (
                                <button
                                    key={colorEnum}
                                    type="button"
                                    onClick={() => setThemeColor(colorEnum)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${themeColor === colorEnum ? 'ring-2 ring-offset-2 ring-matte-dark' : ''}`}
                                    style={{ backgroundColor: THEME_COLOR_MAP[colorEnum] }}
                                >
                                    {themeColor === colorEnum && <Check size={16} className="text-white drop-shadow-md" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !name.trim()}
                            className="btn-fiery"
                        >
                            {isLoading ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Project')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
