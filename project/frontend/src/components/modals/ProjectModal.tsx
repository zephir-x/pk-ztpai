import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { projectService } from '../../api/projectService';
import { type ProjectResponse, ThemeColor } from '../../types/api';
import { useTranslation } from '../../context/LanguageContext';
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
    const { t } = useTranslation();
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
                toast.success(t.modals.project.updateSuccess);
            } else {
                const newProject = await projectService.create(name, description || null, themeColor, workspaceId);
                onSaved(newProject, false);
                toast.success(t.modals.project.createSuccess);
            }
            onClose();
        } catch (err) {
            if (err instanceof AxiosError && err.response?.data) {
                const data = err.response.data;
                if (data.errors) {
                    setError(Object.values(data.errors).flat().join(' '));
                } else {
                    setError(data.message || data.detail || t.workspaceDetails.deleteError);
                }
            } else {
                setError(t.modals.taskDetails.apiErrors.serverError);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md animate-fade-in p-4">
            <div className="glass-panel-elevated animate-modal-enter w-full max-w-md p-6 relative bg-rain-900/90 backdrop-blur-3xl border border-white/25 shadow-2xl overflow-hidden">
                {/* Laser top highlight */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-rain-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <X size={18} />
                </button>

                <h3 className="text-xl font-extrabold text-white mb-4 tracking-tight">
                    {initialData ? t.modals.project.editTitle : t.modals.project.createTitle}
                </h3>

                {error && (
                    <div className="bg-red-500/20 text-red-100 border border-red-400/40 px-4 py-2.5 rounded-xl mb-4 text-xs shadow-glow-crimson/20 backdrop-blur-md">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-rain-200 mb-1.5">
                            {t.modals.project.nameLabel}
                        </label>
                        <input
                            type="text"
                            required
                            className="input-glass"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t.modals.project.namePlaceholder}
                            maxLength={100}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-rain-200 mb-1.5">
                            {t.modals.project.descriptionLabel}
                        </label>
                        <textarea
                            className="input-glass resize-none"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t.modals.project.descriptionPlaceholder}
                            rows={3}
                            maxLength={500}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-rain-200 mb-2">
                            {t.modals.project.themeColorLabel}
                        </label>
                        <div className="flex gap-2.5 flex-wrap justify-center py-1">
                            {THEME_COLORS.map(colorEnum => {
                                const hexColor = THEME_COLOR_MAP[colorEnum];
                                const isSelected = themeColor === colorEnum;
                                return (
                                    <button
                                        key={colorEnum}
                                        type="button"
                                        onClick={() => setThemeColor(colorEnum)}
                                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 relative ${
                                            isSelected
                                                ? 'ring-2 ring-white ring-offset-2 ring-offset-rain-950 scale-105'
                                                : 'hover:opacity-90'
                                        }`}
                                        style={{
                                            backgroundColor: hexColor,
                                            boxShadow: isSelected ? `0 0 16px ${hexColor}` : 'none'
                                        }}
                                    >
                                        {isSelected && <Check size={16} className="text-white drop-shadow-md" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="glass-btn-ghost px-4 py-2 text-sm"
                        >
                            {t.common.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !name.trim()}
                            className="btn-fiery px-5 py-2 text-sm"
                        >
                            <span>{isLoading ? t.common.saving : (initialData ? t.common.save : t.common.create)}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};
