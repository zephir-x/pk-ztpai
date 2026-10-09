import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { workspaceService } from '../../api/workspaceService';
import { type WorkspaceResponse, ThemeColor } from '../../types/api';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

export const THEME_COLOR_MAP: Record<ThemeColor, string> = {
    [ThemeColor.Blue]: '#3b82f6',
    [ThemeColor.Red]: '#ef4444',
    [ThemeColor.Green]: '#10b981',
    [ThemeColor.Yellow]: '#f59e0b',
    [ThemeColor.Purple]: '#8b5cf6',
    [ThemeColor.Pink]: '#ec4899',
    [ThemeColor.Gray]: '#64748b'
};

const THEME_COLORS = Object.values(ThemeColor).filter(val => typeof val === 'number') as ThemeColor[];

interface WorkspaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: (workspace: WorkspaceResponse, isEdit: boolean) => void;
    initialData?: WorkspaceResponse | null;
}

export const WorkspaceModal = ({ isOpen, onClose, onSaved, initialData }: WorkspaceModalProps) => {
    const [name, setName] = useState('');
    const [themeColor, setThemeColor] = useState<ThemeColor>(ThemeColor.Blue);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(initialData?.name || '');
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
                await workspaceService.update(initialData.id, name, themeColor);
                onSaved({ ...initialData, name, themeColor }, true);
                toast.success('The workspace has been updated.');
            } else {
                const newWorkspace = await workspaceService.create(name, themeColor);
                onSaved(newWorkspace, false);
                toast.success('The workspace has been successfully created.');
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
                    {initialData ? 'Edit Workspace' : 'Create New Workspace'}
                </h3>

                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm border border-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-matte-dark mb-1">Workspace Name</label>
                        <input
                            type="text"
                            required
                            className="input-glass"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Engineering Team"
                            maxLength={100}
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
                            {isLoading ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Workspace')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
